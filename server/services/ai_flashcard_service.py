"""AI-assisted flashcard generation."""

import json
import os

from groq import Groq

from services.flashcard_services import FlashcardService
from services.pdf_service import DocumentTextExtractor


class AiFlashcardService:
    MODEL = "llama-3.1-8b-instant"

    def __init__(
        self,
        flashcard_service: FlashcardService,
        document_extractor: DocumentTextExtractor | None = None,
        client: Groq | None = None,
    ):
        self._flashcard_service = flashcard_service
        self._document_extractor = document_extractor or DocumentTextExtractor()
        self._client = client

    def generate_from_file(self, folder_id: str, file_path: str) -> list:
        chunks = self._document_extractor.extract_chunks(file_path)
        raw_response = self._generate_response("\n\n".join(chunks))
        cards = self._parse_cards(raw_response)
        return self._flashcard_service.save_generated_cards(folder_id, cards)

    def _generate_response(self, content: str) -> str:
        client = self._get_client()
        response = client.chat.completions.create(
            model=self.MODEL,
            messages=[{"role": "user", "content": self._build_prompt(content)}],
        )
        print(response)
        return response.choices[0].message.content or ""

    @staticmethod
    def _build_prompt(content: str) -> str:
        return f"""Generate exactly 10 flashcards in English as a raw JSON array.
Each item must contain a clue-based question, a short answer, and status \"review\".
Return JSON only—no markdown or explanation.

CONTENT:
{content}"""

    @staticmethod
    def _parse_cards(raw_response: str) -> list[dict]:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").removeprefix("json").strip()

        try:
            cards = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise ValueError("AI returned invalid JSON.") from error

        if not isinstance(cards, list) or not cards:
            raise ValueError("AI response must contain a non-empty JSON array.")
        if any(not isinstance(card, dict) or not card.get("question") or not card.get("answer") for card in cards):
            raise ValueError("Each generated card requires a question and answer.")
        return cards

    def _get_client(self) -> Groq:
        if self._client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise RuntimeError("GROQ_API_KEY is not configured.")
            self._client = Groq(api_key=api_key)
        return self._client
