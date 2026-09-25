"""AI prompt construction and Groq API integration for the chat assistant."""

import os

from groq import Groq

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

    def build_messages(
        self,
        user_message: str,
        history: list[dict],
        folder_name: str | None = None,
        folder_card_count: int = 0,
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
        system_prompt = self._build_system_prompt(folder_name, folder_card_count)

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
            "their study material, answer academic questions, explain concepts "
            "clearly, and provide study strategies.\n\n"
            "Guidelines:\n"
            "- Be concise but thorough.\n"
            "- Use clear structure: headings (###), bullet points, and numbered lists "
            "when appropriate.\n"
            "- When explaining concepts, use real-world analogies to aid understanding.\n"
            "- You can suggest follow-up questions to deepen understanding.\n"
            "- Never make up facts. If unsure, say so clearly.\n"
            "- Keep responses focused and study-relevant.\n"
            "- Maintain conversation context from previous messages.\n"
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
                "When the student asks vague questions like 'explain this' or 'quiz me', "
                f"assume they are referring to \"{folder_name}\" unless stated otherwise.\n"
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