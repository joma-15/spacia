"""HTTP controllers for flashcards and uploaded-file AI generation."""

from pathlib import Path
from uuid import uuid4

from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView
from werkzeug.utils import secure_filename

from errors import ApiError
from services.ai_flashcard_service import AiFlashcardService
from services.flashcard_services import FlashcardService
from validation import require_fields, require_json_object

flashcards_bp = Blueprint("flashcards", __name__)
flashcard_service = FlashcardService()
ai_flashcard_service = AiFlashcardService(flashcard_service)


class FlashcardGenerationAPI(MethodView):
    """Accept a textbook upload, generate cards, and return the saved records."""
    ALLOWED_EXTENSIONS = {".pdf", ".docx"}

    def post(self, folder_id: str):
        """Keep the upload only for the duration of generation to avoid storing user textbooks."""
        uploaded_file = request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            raise ApiError("Upload a PDF or DOCX textbook to generate flashcards.", 400)

        filename = secure_filename(uploaded_file.filename)
        extension = Path(filename).suffix.lower()
        if extension not in self.ALLOWED_EXTENSIONS:
            raise ApiError("Only PDF and DOCX textbooks are supported.", 400)

        # Never trust the supplied filename as a storage path.  A UUID prevents
        # path traversal and prevents two users' uploads from colliding.
        upload_dir = Path(current_app.config["UPLOAD_FOLDER"])
        upload_dir.mkdir(parents=True, exist_ok=True)
        source_file = upload_dir / f"{uuid4()}{extension}"
        uploaded_file.save(source_file)

        try:
            flashcards = ai_flashcard_service.generate_from_file(folder_id, str(source_file))
        finally:
            # Cleanup belongs in `finally`: failed AI/PDF work must not leave
            # private textbooks behind on the server.
            source_file.unlink(missing_ok=True)

        return jsonify({"message": "Flashcards generated.", "data": [card.to_dict() for card in flashcards]})


class SavedFlashcardsAPI(MethodView):
    def get(self, folder_id: str):
        """Return the database copy used by clients to refresh their local cache."""
        flashcards = flashcard_service.list_for_folder(folder_id)
        return jsonify([flashcard.to_dict() for flashcard in flashcards])


class ManualFlashcardAPI(MethodView):
    def post(self, folder_id: str):
        """Create one user-authored card; route validation stays separate from persistence."""
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "question", "answer", "status")
        flashcard = flashcard_service.create(folder_id, data["question"], data["answer"], data["status"])
        return jsonify({"message": "Flashcard created.", "data": flashcard.to_dict()}), 201


class FlashcardItemAPI(MethodView):
    def patch(self, flashcard_id: str):
        """Change only the study status, preserving the question and answer."""
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "status")
        flashcard = flashcard_service.update_status(flashcard_id, data["status"])
        return jsonify({"message": "Flashcard updated.", "data": flashcard.to_dict()})

    def delete(self, flashcard_id: str):
        flashcard_service.delete(flashcard_id)
        return jsonify({"message": "Flashcard deleted successfully."})


class FolderFlashcardsAPI(MethodView):
    def delete(self, folder_id: str):
        """Delete every card in a folder when the user clears a deck."""
        deleted_count = flashcard_service.delete_for_folder(folder_id)
        return jsonify({"message": "Flashcards deleted successfully.", "deletedCount": deleted_count})


flashcards_bp.add_url_rule("/flashcards/<string:folder_id>", view_func=FlashcardGenerationAPI.as_view("flashcard_generation"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/saved", view_func=SavedFlashcardsAPI.as_view("saved_flashcards"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/manualSaved", view_func=ManualFlashcardAPI.as_view("manual_flashcard"))
flashcards_bp.add_url_rule("/flashcards/<string:flashcard_id>", view_func=FlashcardItemAPI.as_view("flashcard_item"))
flashcards_bp.add_url_rule("/flashcards/folder/<string:folder_id>", view_func=FolderFlashcardsAPI.as_view("folder_flashcards"))
