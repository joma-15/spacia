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
            response_format={"type": "json_object"},
        )
        print(response)
        return response.choices[0].message.content or ""

    @staticmethod
    def _build_prompt(content: str) -> str:
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
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").removeprefix("json").strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise ValueError("AI returned invalid JSON.") from error

        if not isinstance(data, dict) or "flashcards" not in data:
            raise ValueError("AI response must contain a JSON object with a 'flashcards' key.")

        cards = data["flashcards"]
        if not isinstance(cards, list) or not cards:
            raise ValueError("AI response must contain a non-empty 'flashcards' array.")

        normalized_cards = []
        for card in cards:
            if not isinstance(card, dict):
                continue
            
            # Extract keys defensively, fallback to common alternatives
            question = card.get("question") or card.get("clue") or card.get("front") or card.get("text")
            answer = card.get("answer") or card.get("short_answer") or card.get("back") or card.get("definition")
            status = card.get("status") or "review"

            if not question or not answer:
                # If a specific card is incomplete, skip it rather than failing the whole upload,
                # or raise error if we have too few cards. Here we raise if it is entirely empty.
                continue

            normalized_cards.append({
                "question": str(question).strip(),
                "answer": str(answer).strip(),
                "status": str(status).strip()
            })

        if not normalized_cards:
            raise ValueError("Each generated card requires a question and answer.")

        return normalized_cards

    def _get_client(self) -> Groq:
        if self._client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise RuntimeError("GROQ_API_KEY is not configured.")
            self._client = Groq(api_key=api_key)
        return self._client
