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

# Blueprints let us split our application routing into multiple files.
# All routes related to flashcards are bundled here.
flashcards_bp = Blueprint("flashcards", __name__)

# Instantiate the services we need to fetch, generate, and save cards.
flashcard_service = FlashcardService()
ai_flashcard_service = AiFlashcardService(flashcard_service)


class FlashcardGenerationAPI(MethodView):
    """
    Pluggable view (MethodView) for generating flashcards.
    Using MethodView means if a POST request comes in, Flask automatically calls the `post` function.
    
    This endpoint:
    1. Receives an uploaded PDF or DOCX file.
    2. Saves it temporarily on the server.
    3. Triggers the AI generator to extract text and create flashcards.
    4. Automatically deletes the file afterwards so it doesn't waste space.
    """
    ALLOWED_EXTENSIONS = {".pdf", ".docx"}

    def post(self, folder_id: str):
        # Extract the uploaded file from the request form
        uploaded_file = request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            raise ApiError("Upload a PDF or DOCX textbook to generate flashcards.", 400)

        # secure_filename cleans up the user's filename to prevent directory traversal exploits
        # (e.g. filename like '../../etc/passwd' which could let hackers overwrite systems)
        filename = secure_filename(uploaded_file.filename)
        extension = Path(filename).suffix.lower()
        if extension not in self.ALLOWED_EXTENSIONS:
            raise ApiError("Only PDF and DOCX textbooks are supported.", 400)

        # Ensure the uploads directory exists
        upload_dir = Path(current_app.config["UPLOAD_FOLDER"])
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save the file with a random UUID name to prevent collisions
        # (e.g. if two users upload 'notes.pdf' at the exact same millisecond)
        source_file = upload_dir / f"{uuid4()}{extension}"
        uploaded_file.save(source_file)

        try:
            # Generate flashcards using our AI service
            flashcards = ai_flashcard_service.generate_from_file(folder_id, str(source_file))
        finally:
            # The 'finally' block always runs, even if generate_from_file crashes!
            # This is crucial so we never leave temporary PDF files lying around on the server.
            source_file.unlink(missing_ok=True)

        # Return the generated cards formatted as JSON
        return jsonify({"message": "Flashcards generated.", "data": [card.to_dict() for card in flashcards]})


class SavedFlashcardsAPI(MethodView):
    """
    View for fetching already-saved cards.
    If a GET request comes in, return a list of all cards in the folder.
    """
    def get(self, folder_id: str):
        flashcards = flashcard_service.list_for_folder(folder_id)
        return jsonify([flashcard.to_dict() for flashcard in flashcards])


class ManualFlashcardAPI(MethodView):
    """
    View for adding a single card manually.
    If a POST request comes in, extract the question and answer from the JSON body
    and create it.
    """
    def post(self, folder_id: str):
        # Ensure the client sent actual JSON
        data = require_json_object(request.get_json(silent=True))
        # Ensure all required fields exist
        require_fields(data, "question", "answer", "status")
        
        flashcard = flashcard_service.create(folder_id, data["question"], data["answer"], data["status"])
        return jsonify({"message": "Flashcard created.", "data": flashcard.to_dict()}), 201


class FlashcardItemAPI(MethodView):
    """
    View for modifying or deleting a single existing flashcard by its specific card ID.
    - PATCH requests update the study status (e.g. marking it 'understood').
    - DELETE requests remove the card permanently.
    """
    def patch(self, flashcard_id: str):
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "status")
        flashcard = flashcard_service.update_status(flashcard_id, data["status"])
        return jsonify({"message": "Flashcard updated.", "data": flashcard.to_dict()})

    def delete(self, flashcard_id: str):
        flashcard_service.delete(flashcard_id)
        return jsonify({"message": "Flashcard deleted successfully."})


class FolderFlashcardsAPI(MethodView):
    """
    View for operations on a whole folder's collection of cards.
    - DELETE requests delete every card in the deck.
    """
    def delete(self, folder_id: str):
        deleted_count = flashcard_service.delete_for_folder(folder_id)
        return jsonify({"message": "Flashcards deleted successfully.", "deletedCount": deleted_count})


# Register URL routes and connect them to our MethodViews.
# Flask's as_view() method registers the class as a standard Flask endpoint.
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>", view_func=FlashcardGenerationAPI.as_view("flashcard_generation"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/saved", view_func=SavedFlashcardsAPI.as_view("saved_flashcards"))
flashcards_bp.add_url_rule("/flashcards/<string:folder_id>/manualSaved", view_func=ManualFlashcardAPI.as_view("manual_flashcard"))
flashcards_bp.add_url_rule("/flashcards/<string:flashcard_id>", view_func=FlashcardItemAPI.as_view("flashcard_item"))
flashcards_bp.add_url_rule("/flashcards/folder/<string:folder_id>", view_func=FolderFlashcardsAPI.as_view("folder_flashcards"))
