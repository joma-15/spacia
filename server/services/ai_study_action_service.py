"""Controlled, user-scoped study actions available to the AI assistant."""

from collections.abc import Callable

from extensions import db
from errors import ApiError
from services.flashcard_services import FlashcardService
from services.folder_service import FolderService


class AiStudyActionService:
    """Executes a small, audited tool set using the application's real services."""

    DEFAULT_ACCENT_COLOR = "#34D399"
    MAX_FLASHCARDS_PER_ACTION = 25

    def __init__(
        self,
        generate_cards: Callable[[str, int], list[dict]],
        folder_service: FolderService | None = None,
        flashcard_service: FlashcardService | None = None,
    ) -> None:
        self._generate_cards = generate_cards
        self._folders = folder_service or FolderService()
        self._flashcards = flashcard_service or FlashcardService()

    @staticmethod
    def tool_definitions() -> list[dict]:
        """The only database-affecting capabilities exposed to the AI provider."""
        return [
            {"type": "function", "function": {"name": "get_folders", "description": "List the authenticated user's study folders.", "parameters": {"type": "object", "properties": {}}}},
            {"type": "function", "function": {"name": "get_folder_contents", "description": "Read flashcards in one of the authenticated user's folders.", "parameters": {"type": "object", "properties": {"folder_id": {"type": "string"}, "folder_name": {"type": "string"}}, "additionalProperties": False}}},
            {"type": "function", "function": {"name": "create_folder", "description": "Create a folder only when the user explicitly requests it.", "parameters": {"type": "object", "properties": {"name": {"type": "string"}, "accent_color": {"type": "string"}}, "required": ["name"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "create_flashcards", "description": "Generate and save study flashcards in an existing folder. Use the current folder when no folder is supplied.", "parameters": {"type": "object", "properties": {"topic": {"type": "string"}, "count": {"type": "integer", "minimum": 1, "maximum": 25}, "folder_id": {"type": "string"}, "folder_name": {"type": "string"}}, "required": ["topic", "count"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "create_folder_with_flashcards", "description": "Atomically create a new folder and generate flashcards in it when the user explicitly asks for both.", "parameters": {"type": "object", "properties": {"name": {"type": "string"}, "topic": {"type": "string"}, "count": {"type": "integer", "minimum": 1, "maximum": 25}, "accent_color": {"type": "string"}}, "required": ["name", "topic", "count"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "update_flashcard", "description": "Update an identified flashcard only when the user explicitly asks to change it.", "parameters": {"type": "object", "properties": {"flashcard_id": {"type": "string"}, "question": {"type": "string"}, "answer": {"type": "string"}}, "required": ["flashcard_id"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "delete_flashcard", "description": "Delete an identified flashcard only after an explicit user deletion request.", "parameters": {"type": "object", "properties": {"flashcard_id": {"type": "string"}}, "required": ["flashcard_id"], "additionalProperties": False}}},
        ]

    def execute(self, name: str, arguments: dict, user_id: str, current_folder_id: str | None) -> dict:
        handlers = {
            "get_folders": self._get_folders,
            "get_folder_contents": self._get_folder_contents,
            "create_folder": self._create_folder,
            "create_flashcards": self._create_flashcards,
            "create_folder_with_flashcards": self._create_folder_with_flashcards,
            "update_flashcard": self._update_flashcard,
            "delete_flashcard": self._delete_flashcard,
        }
        handler = handlers.get(name)
        if handler is None:
            raise ApiError("Unsupported AI action.", 400)
        return handler(arguments, user_id, current_folder_id)

    def _resolve_folder(self, arguments: dict, user_id: str, current_folder_id: str | None):
        # An explicit reference always beats the selected-folder fallback.
        folder_id = arguments.get("folder_id")
        if folder_id:
            return self._folders.get_owned(str(folder_id), user_id)

        name = str(arguments.get("folder_name") or "").strip()
        if not name and current_folder_id:
            return self._folders.get_owned(current_folder_id, user_id)
        if not name:
            raise ApiError("Choose a folder before creating flashcards.", 400)
        matches = [folder for folder in self._folders.list_all(user_id) if folder.subject.casefold() == name.casefold()]
        if not matches:
            raise ApiError(f'No folder named "{name}" was found.', 404)
        if len(matches) > 1:
            raise ApiError(f'Multiple folders are named "{name}". Please choose one.', 409)
        return matches[0]

    def _get_folders(self, _arguments: dict, user_id: str, _current_folder_id: str | None) -> dict:
        return {"folders": [folder.to_dict() for folder in self._folders.list_all(user_id)]}

    def _get_folder_contents(self, arguments: dict, user_id: str, current_folder_id: str | None) -> dict:
        folder = self._resolve_folder(arguments, user_id, current_folder_id)
        cards = self._flashcards.list_for_folder(folder.id, user_id)
        return {"folder": folder.to_dict(), "flashcards": [card.to_dict() for card in cards]}

    def _create_folder(self, arguments: dict, user_id: str, _current_folder_id: str | None) -> dict:
        name = str(arguments.get("name") or "").strip()
        if any(folder.subject.casefold() == name.casefold() for folder in self._folders.list_all(user_id)):
            raise ApiError(f'You already have a folder named "{name}".', 409)
        folder = self._folders.create(name, str(arguments.get("accent_color") or self.DEFAULT_ACCENT_COLOR), user_id)
        return {"action": "folder_created", "folder": folder.to_dict()}

    def _generate_and_save(self, folder, topic: str, count: int, user_id: str, *, commit: bool = True) -> list:
        if not topic.strip():
            raise ApiError("A flashcard topic is required.", 400)
        if not 1 <= count <= self.MAX_FLASHCARDS_PER_ACTION:
            raise ApiError(f"Create between 1 and {self.MAX_FLASHCARDS_PER_ACTION} flashcards at a time.", 400)
        cards = self._generate_cards(topic.strip(), count)
        return self._flashcards.save_generated_cards(folder.id, user_id, cards, commit=commit)

    def _create_flashcards(self, arguments: dict, user_id: str, current_folder_id: str | None) -> dict:
        folder = self._resolve_folder(arguments, user_id, current_folder_id)
        cards = self._generate_and_save(folder, str(arguments.get("topic") or ""), int(arguments.get("count", 0)), user_id)
        return {"action": "flashcards_created", "folder": folder.to_dict(), "count": len(cards), "flashcards": [card.to_dict() for card in cards]}

    def _create_folder_with_flashcards(self, arguments: dict, user_id: str, _current_folder_id: str | None) -> dict:
        name = str(arguments.get("name") or "").strip()
        if any(folder.subject.casefold() == name.casefold() for folder in self._folders.list_all(user_id)):
            raise ApiError(f'You already have a folder named "{name}".', 409)
        # Generate before opening the transaction. Folder and cards are then committed together.
        topic, count = str(arguments.get("topic") or ""), int(arguments.get("count", 0))
        if not topic.strip():
            raise ApiError("A flashcard topic is required.", 400)
        if not 1 <= count <= self.MAX_FLASHCARDS_PER_ACTION:
            raise ApiError(f"Create between 1 and {self.MAX_FLASHCARDS_PER_ACTION} flashcards at a time.", 400)
        generated = self._generate_cards(topic.strip(), count)
        try:
            folder = self._folders.create(name, str(arguments.get("accent_color") or self.DEFAULT_ACCENT_COLOR), user_id, commit=False)
            cards = self._flashcards.save_generated_cards(folder.id, user_id, generated, commit=False)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return {"action": "folder_and_flashcards_created", "folder": folder.to_dict(), "count": len(cards), "flashcards": [card.to_dict() for card in cards]}

    def _update_flashcard(self, arguments: dict, user_id: str, _current_folder_id: str | None) -> dict:
        card = self._flashcards.update_content(arguments["flashcard_id"], user_id, arguments.get("question"), arguments.get("answer"))
        return {"action": "flashcard_updated", "flashcard": card.to_dict()}

    def _delete_flashcard(self, arguments: dict, user_id: str, _current_folder_id: str | None) -> dict:
        card_id = arguments["flashcard_id"]
        self._flashcards.delete(card_id, user_id)
        return {"action": "flashcard_deleted", "flashcard_id": card_id}
