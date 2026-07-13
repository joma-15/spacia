"""Business operations for manually managed flashcards."""

from extensions import db
from errors import NotFoundError
from models.flashcard import Flashcard


class FlashcardService:
    """Database use cases for cards; routes should call this instead of touching models."""
    VALID_STATUSES = {"review", "understood"}

    def create(self, folder_id: str, question: str, answer: str, status: str) -> Flashcard:
        """Validate input before committing so invalid enum values never reach the database."""
        self._validate_status(status)
        flashcard = Flashcard(
            folder_id=folder_id,
            question=question.strip(),
            answer=answer.strip(),
            status=status,
        )
        db.session.add(flashcard)
        db.session.commit()
        return flashcard

    def list_for_folder(self, folder_id: str) -> list[Flashcard]:
        """Use creation order so a deck has a stable, predictable display order."""
        return Flashcard.query.filter_by(folder_id=folder_id).order_by(Flashcard.created_at).all()

    def update_status(self, flashcard_id: str, status: str) -> Flashcard:
        """Fetch first so a missing ID becomes a clear 404 instead of a silent no-op."""
        self._validate_status(status)
        flashcard = self._get_or_raise(flashcard_id)
        flashcard.status = status
        db.session.commit()
        return flashcard

    def delete(self, flashcard_id: str) -> None:
        db.session.delete(self._get_or_raise(flashcard_id))
        db.session.commit()

    def delete_for_folder(self, folder_id: str) -> int:
        deleted_count = Flashcard.query.filter_by(folder_id=folder_id).delete()
        db.session.commit()
        return deleted_count

    def save_generated_cards(self, folder_id: str, cards: list[dict]) -> list[Flashcard]:
        """Convert untrusted LLM dictionaries to validated ORM records in one transaction."""
        flashcards = [
            Flashcard(
                folder_id=folder_id,
                question=card["question"].strip(),
                answer=card["answer"].strip(),
                status=card.get("status", "review"),
            )
            for card in cards
        ]
        for flashcard in flashcards:
            self._validate_status(flashcard.status)

        db.session.add_all(flashcards)
        db.session.commit()
        return flashcards

    @staticmethod
    def _validate_status(status: str) -> None:
        """Keep the service validation aligned with the database enum."""
        if status not in FlashcardService.VALID_STATUSES:
            allowed = ", ".join(sorted(FlashcardService.VALID_STATUSES))
            raise ValueError(f"Status must be one of: {allowed}.")

    @staticmethod
    def _get_or_raise(flashcard_id: str) -> Flashcard:
        """Centralize not-found behavior so every endpoint returns the same error shape."""
        flashcard = db.session.get(Flashcard, flashcard_id)
        if flashcard is None:
            raise NotFoundError("Flashcard")
        return flashcard
