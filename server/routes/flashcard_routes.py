"""HTTP controllers for flashcards and AI generation."""

from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView

from errors import ApiError
from services.ai_flashcard_service import AiFlashcardService
from services.flashcard_services import FlashcardService
from validation import require_fields, require_json_object

flashcards_bp = Blueprint("flashcards", __name__)
flashcard_service = FlashcardService()
ai_flashcard_service = AiFlashcardService(flashcard_service)


class FlashcardGenerationAPI(MethodView):
    def get(self, folder_id: str):
        source_file = current_app.config.get("FLASHCARD_SOURCE_FILE")
        if not source_file:
            raise ApiError("AI generation requires FLASHCARD_SOURCE_FILE to be configured.", 503)

        flashcards = ai_flashcard_service.generate_from_file(folder_id, source_file)
        return jsonify({"message": "Flashcards generated.", "data": [card.to_dict() for card in flashcards]})


class SavedFlashcardsAPI(MethodView):
    def get(self, folder_id: str):
        flashcards = flashcard_service.list_for_folder(folder_id)
        return jsonify([flashcard.to_dict() for flashcard in flashcards])


class ManualFlashcardAPI(MethodView):
    def post(self, folder_id: str):
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "question", "answer", "status")
        flashcard = flashcard_service.create(folder_id, data["question"], data["answer"], data["status"])
        return jsonify({"message": "Flashcard created.", "data": flashcard.to_dict()}), 201


class FlashcardItemAPI(MethodView):
    def patch(self, flashcard_id: str):
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "status")
        flashcard = flashcard_service.update_status(flashcard_id, data["status"])
        return jsonify({"message": "Flashcard updated.", "data": flashcard.to_dict()})

    def delete(self, flashcard_id: str):
        flashcard_service.delete(flashcard_id)
        return jsonify({"message": "Flashcard deleted successfully."})


class FolderFlashcardsAPI(MethodView):
    def delete(self, folder_id: str):
        deleted_count = flashcard_service.delete_for_folder(folder_id)
        return jsonify({"message": "Flashcards deleted successfully.", "deletedCount": deleted_count})


flashcards_bp.add_url_rule("/flashcards/<string:folder_id>", view_func=FlashcardGenerationAPI.as_view("flashcard_generation"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/saved", view_func=SavedFlashcardsAPI.as_view("saved_flashcards"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/manualSaved", view_func=ManualFlashcardAPI.as_view("manual_flashcard"))
flashcards_bp.add_url_rule("/flashcards/<string:flashcard_id>", view_func=FlashcardItemAPI.as_view("flashcard_item"))
flashcards_bp.add_url_rule("/flashcards/folder/<string:folder_id>", view_func=FolderFlashcardsAPI.as_view("folder_flashcards"))
