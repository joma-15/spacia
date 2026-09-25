"""AI prompt construction and Groq API integration for the chat assistant."""

import json
import os
from collections.abc import Callable

from groq import Groq

from errors import ApiError

# Maximum number of recent messages sent to the AI provider.
# Keeps token usage predictable while preserving meaningful context.
# Architecture is flexible: swap this for token-counting or summarization later.
MAX_HISTORY_MESSAGES = 20


class AiAssistantService:
    """
    Handles all interactions with the Groq AI provider for the chat assistant.

    Responsibilities
    ----------------
    - Build a well-structured list of messages (system → history → user).
    - Send the message list to the Groq API.
    - Return the assistant's reply as a plain string.

    This service is deliberately free of database logic.  All persistence
    is handled by ConversationService so each class has one responsibility.
    """

    def __init__(self, client: Groq | None = None) -> None:
        self._client = client
        self._model = os.getenv("GROQ_MODEL")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_response(self, messages: list[dict]) -> str:
        """
        Send a pre-built message list to the Groq API and return the reply.

        Parameters
        ----------
        messages : list[dict]
            A fully assembled list of {"role": ..., "content": ...} dicts,
            as produced by `build_messages`.

        Returns
        -------
        str
            The assistant's text response.

        Raises
        ------
        RuntimeError
            If GROQ_API_KEY is not configured.
        ValueError
            If the AI provider returns an empty or malformed response.
        """
        client = self._get_client()

        completion = client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=1,
            stop=None,
            stream=False,
        )

        response_text = completion.choices[0].message.content
        if not response_text:
            raise ValueError("AI provider returned an empty response.")

        return response_text.strip()

    def generate_response_with_tools(
        self,
        messages: list[dict],
        tools: list[dict],
        execute_tool: Callable[[str, dict], dict],
    ) -> tuple[str, list[dict]]:
        """Run a bounded tool-call loop and return the final text plus real actions."""
        client = self._get_client()
        working_messages = list(messages)
        actions: list[dict] = []

        for _ in range(6):
            completion = client.chat.completions.create(
                model=self._model,
                messages=working_messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.3,
                max_completion_tokens=1024,
            )
            message = completion.choices[0].message
            tool_calls = message.tool_calls or []
            if not tool_calls:
                if not message.content:
                    raise ValueError("AI provider returned an empty response.")
                return message.content.strip(), actions

            working_messages.append(
                {
                    "role": "assistant",
                    "content": message.content or "",
                    "tool_calls": [
                        {
                            "id": call.id,
                            "type": "function",
                            "function": {
                                "name": call.function.name,
                                "arguments": call.function.arguments,
                            },
                        }
                        for call in tool_calls
                    ],
                }
            )
            for call in tool_calls:
                try:
                    arguments = json.loads(call.function.arguments or "{}")
                    if not isinstance(arguments, dict):
                        raise ValueError("Tool arguments must be an object.")
                    result = execute_tool(call.function.name, arguments)
                except ApiError as exc:
                    result = {"error": exc.message}
                except (ValueError, json.JSONDecodeError) as exc:
                    result = {"error": str(exc)}
                except Exception:
                    # Never send database/provider implementation details back to the model.
                    result = {"error": "The requested study action could not be completed."}
                actions.append({"type": call.function.name, "result": result})
                working_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.id,
                        "content": json.dumps(result),
                    }
                )

            # Validation/authorization failures are already clear and safe to
            # show the user. Return them directly instead of making another AI
            # provider call that could replace a useful message (for example,
            # the 25-card limit) with a generic availability error.
            failures = [
                action["result"]["error"]
                for action in actions
                if isinstance(action.get("result"), dict)
                and action["result"].get("error")
            ]
            if failures:
                return f"I couldn't complete that: {failures[0]}", actions

        raise ValueError("AI requested too many actions for one message.")

    def generate_flashcards(self, topic: str, count: int) -> list[dict]:
        """Generate a bounded, validated card payload; persistence stays in FlashcardService."""
        if not topic.strip():
            raise ValueError("A flashcard topic is required.")
        if not 1 <= count <= 25:
            raise ValueError("Create between 1 and 25 flashcards at a time.")
        client = self._get_client()
        prompt = (
            f"Create exactly {count} distinct study flashcards about {topic.strip()}. "
            "Return JSON only: {\"flashcards\":[{\"question\":string,\"answer\":string,\"status\":\"review\"}]}. "
            "Questions must cover different useful concepts."
        )
        completion = client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_completion_tokens=2048,
        )
        content = completion.choices[0].message.content or ""
        try:
            data = json.loads(content)
            cards = data["flashcards"]
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise ValueError("AI returned invalid flashcards.") from exc
        if not isinstance(cards, list) or not cards:
            raise ValueError("AI returned no flashcards.")
        normalized = [
            {"question": str(card["question"]).strip(), "answer": str(card["answer"]).strip(), "status": "review"}
            for card in cards
            if isinstance(card, dict) and card.get("question") and card.get("answer")
        ]
        if not normalized:
            raise ValueError("AI returned no usable flashcards.")
        return normalized[:count]

    def build_messages(
        self,
        user_message: str,
        history: list[dict],
        folder_name: str | None = None,
        folder_card_count: int = 0,
        folder_flashcards: list[dict] | None = None,
    ) -> list[dict]:
        """
        Assemble the full message list to send to the AI provider.

        Order:
            1. System instruction (Spacia identity + folder context)
            2. Previous conversation history (trimmed to MAX_HISTORY_MESSAGES)
            3. Latest user message

        Parameters
        ----------
        user_message : str
            The current message typed by the user.
        history : list[dict]
            Previous messages from the database, each as
            {"role": "user"|"assistant", "content": "..."}.
            Should already be in chronological order.
        folder_name : str | None
            Name of the currently selected folder, or None for general chat.
        folder_card_count : int
            Number of flashcards in the folder (for context richness).

        Returns
        -------
        list[dict]
            Ready-to-send messages list for the Groq API.
        """
        system_prompt = self._build_system_prompt(
            folder_name, folder_card_count, folder_flashcards
        )

        # Trim history to avoid sending too many tokens
        trimmed_history = history[-MAX_HISTORY_MESSAGES:]

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(trimmed_history)
        messages.append({"role": "user", "content": user_message})

        return messages

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_system_prompt(
        self,
        folder_name: str | None,
        folder_card_count: int,
        folder_flashcards: list[dict] | None = None,
    ) -> str:
        """
        Build the system-level instruction that defines the AI's behaviour.

        The prompt changes based on whether a folder is selected:
        - General chat → helpful study assistant for all subjects.
        - Folder selected → same assistant, but focused on that subject.
        """
        base = (
            "You are Spacia AI, an expert study assistant built into the Spacia "
            "flashcard and learning app. Your role is to help students understand "
            "Spacia was developed by Jhon Marcel Adelantar\n" 
            
            "If the user asks who developed, created, or built Spacia, "  
            "answer this:\n"
            "Spacia was developed by Jhon Marcel Adelantar, a Computer Engineering student "
            "and software developer from the Philippines. He created Spacia as an AI-powered "
            "study and flashcard application designed to help students learn more effectively.\n\n"

            "their study material, answer academic questions, explain concepts "
            "clearly, and provide study strategies.\n\n"
            "Guidelines:\n"
            "- Be concise but thorough.\n"
            "- Write in plain, natural text. Avoid Markdown and decorative special "
            "characters such as #, *, |, backticks, and repeated symbols. Use short "
            "paragraphs or simple numbered sentences only when they improve clarity.\n"
            "- When explaining concepts, use real-world analogies to aid understanding.\n"
            "- You can suggest follow-up questions to deepen understanding.\n"
            "- Never make up facts. If unsure, say so clearly.\n"
            "- Keep responses focused and study-relevant.\n"
            "- Maintain conversation context from previous messages.\n"
            "- You can use controlled study tools when the user clearly asks to create, "
            "inspect, update, or delete study data. Never claim an action succeeded until "
            "a tool reports success. Do not mutate data for vague requests.\n"
            "- For folder or card questions, retrieve the current data with a read tool "
            "instead of guessing. To modify or delete a card, first retrieve its contents "
            "to obtain its ID. Delete only for an unambiguous, explicit request.\n"
        )

        if folder_name:
            folder_context = (
                f"\nCurrent Study Context:\n"
                f"The student is currently studying the subject: \"{folder_name}\".\n"
            )
            if folder_card_count > 0:
                folder_context += (
                    f"This folder contains {folder_card_count} flashcard(s).\n"
                )
            folder_context += (
                "Prioritize explanations and examples that are relevant to this subject. "
                f"The user selected \"{folder_name}\" in the app, so treat every message "
                "in this conversation as referring to this folder unless they explicitly "
                "name a different folder. When the student asks vague questions like "
                "'explain this', 'summarize this', or 'quiz me', use this folder's cards.\n"
            )
            if folder_flashcards:
                # The selected folder is supplied as study context so requests such as
                # "summarize this", "quiz me", and "explain this more deeply" work
                # without asking the model to infer the material from the folder name.
                # Deliberately exclude card IDs: they are implementation details, not
                # learning content. The read tool remains available for other folders
                # and for mutations that require an ID.
                card_lines = []
                # Keep a large deck from consuming the entire provider context.
                for index, card in enumerate(folder_flashcards[:50], start=1):
                    question = str(card.get("question") or "").strip()[:1_000]
                    answer = str(card.get("answer") or "").strip()[:1_000]
                    if question or answer:
                        card_lines.append(
                            f"{index}. Front: {question}\n   Back: {answer}"
                        )
                if card_lines:
                    folder_context += (
                        "\nSelected folder flashcards (use these as the source material "
                        "for summaries, quizzes, and deeper explanations):\n"
                        + "\n".join(card_lines)
                        + "\n"
                    )
            return base + folder_context

        return (
            base
            + "\nThe student has not selected a specific subject folder. "
            "Provide general academic help across all subjects.\n"
        )

    def _get_client(self) -> Groq:
        """Lazy-load the Groq client, verifying the API key is configured."""
        if self._client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise RuntimeError(
                    "GROQ_API_KEY is not configured. "
                    "Add it to the server/.env file."
                )
            self._client = Groq(api_key=api_key)
        return self._client
