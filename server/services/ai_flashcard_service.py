"""AI-assisted flashcard generation."""

import json
import os

from groq import Groq

from services.flashcard_services import FlashcardService
from services.pdf_service import DocumentTextExtractor


class AiFlashcardService:
    """
    This service coordinates with Groq's AI API (Llama 3) to convert 
    extracted document text into a neat list of ready-to-study flashcard questions and answers.
    """
    MODEL = "llama-3.1-8b-instant"

    def __init__(
        self,
        flashcard_service: FlashcardService,
        document_extractor: DocumentTextExtractor | None = None,
        client: Groq | None = None,
    ):
        """
        Creates an instance of the AI Service. 
        It needs a flashcard_service to save the cards, a document_extractor to read documents,
        and optionally a custom Groq client (useful during automated testing).
        """
        self._flashcard_service = flashcard_service
        self._document_extractor = document_extractor or DocumentTextExtractor()
        self._client = client

    def generate_from_file(self, folder_id: str, file_path: str) -> list:
        """
        Main entry point for generating flashcards from a file upload:
        1. Breaks down the file text into readable chunks.
        2. Joins the chunks together and sends them to the AI model.
        3. Parses the AI's JSON output back into Python lists.
        4. Validates and saves the cards to the database for this folder.
        """
        chunks = self._document_extractor.extract_chunks(file_path)
        
        # Merge all chunks with two newlines in between, then get AI response
        raw_response = self._generate_response("\n\n".join(chunks))
        
        # Turn the raw text response from the AI into a structured list of dictionaries
        cards = self._parse_cards(raw_response)
        
        # Save the new cards to the database and return them
        return self._flashcard_service.save_generated_cards(folder_id, cards)

    def _generate_response(self, content: str) -> str:
        """
        Builds the prompt, calls the Groq AI API, and requests the response 
        strictly formatted as a JSON object.
        """
        client = self._get_client()
        response = client.chat.completions.create(
            model=self.MODEL,
            messages=[{"role": "user", "content": self._build_prompt(content)}],
            # This flag forces the model to return structured JSON instead of general chat text.
            response_format={"type": "json_object"},
        )
        print(response)
        # Safely return the text content from the first response option
        return response.choices[0].message.content or ""

    @staticmethod
    def _build_prompt(content: str) -> str:
        """
        Constructs the detailed instruction prompt for the AI.
        It guides the AI to output exactly 10 flashcards matching our required database schema.
        """
        return f"""You are a professional study helper. Generate exactly 10 flashcards in English based on the provided content.
Return the output as a valid JSON object containing a "flashcards" key, which points to an array of flashcards.
Each flashcard in the array must be an object with exactly three keys:
- "question": a clue-based question
- "answer": a short answer
- "status": the string "review"

JSON Schema:
{{
  "flashcards": [
    {{
      "question": "question text",
      "answer": "answer text",
      "status": "review"
    }}
  ]
}}

CONTENT:
{content}"""

    @staticmethod
    def _parse_cards(raw_response: str) -> list[dict]:
        """
        Processes the raw string returned by the AI:
        1. Cleans off code block markers (like ```json ... ```) if the AI added them.
        2. Tries to decode it from raw text to Python structures (JSON parsing).
        3. Validates the JSON shape (ensures it is a list of items and has the correct keys).
        4. Standardizes keys in case the AI used different names (e.g. "front" or "definition").
        """
        cleaned = raw_response.strip()
        
        # If the AI wrapped its output in markdown code blocks, strip them off.
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").removeprefix("json").strip()

        # Parse the JSON string
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise ValueError("AI returned invalid JSON.") from error

        # Check if the output is a dictionary containing a 'flashcards' key
        if not isinstance(data, dict) or "flashcards" not in data:
            raise ValueError("AI response must contain a JSON object with a 'flashcards' key.")

        cards = data["flashcards"]
        # Check if flashcards is a non-empty list
        if not isinstance(cards, list) or not cards:
            raise ValueError("AI response must contain a non-empty 'flashcards' array.")

        normalized_cards = []
        for card in cards:
            if not isinstance(card, dict):
                continue
            
            # Extract keys defensively, falling back to common alternative names 
            # in case the AI did not follow instructions perfectly.
            question = card.get("question") or card.get("clue") or card.get("front") or card.get("text")
            answer = card.get("answer") or card.get("short_answer") or card.get("back") or card.get("definition")
            status = card.get("status") or "review"

            # Skip incomplete cards instead of crashing the whole process
            if not question or not answer:
                continue

            # Standardize output format
            normalized_cards.append({
                "question": str(question).strip(),
                "answer": str(answer).strip(),
                "status": str(status).strip()
            })

        # Ensure we have at least one valid card before completing
        if not normalized_cards:
            raise ValueError("Each generated card requires a question and answer.")

        return normalized_cards

    def _get_client(self) -> Groq:
        """
        Creates or returns the Groq API client. 
        It lazy-loads the client (creates it only when actually needed),
        and verifies that the API key is configured in the environment.
        """
        if self._client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise RuntimeError("GROQ_API_KEY is not configured.")
            self._client = Groq(api_key=api_key)
        return self._client
