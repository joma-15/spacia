"""HTTP controllers for folders."""

from flask import Blueprint, jsonify, request
from flask.views import MethodView

from services.folder_service import FolderService
from validation import require_fields, require_json_object

from flask_jwt_extended import jwt_required, get_jwt_identity

# Blueprint for all folder-related routes (subjects inside the app)
folders_bp = Blueprint("folders", __name__)
folder_service = FolderService()


class FolderCollectionAPI(MethodView):
    """
    Handles operations on the whole folders collection:
    - GET: list all folders created by the user.
    - POST: create a new folder with a subject name and background color.
    """
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        folders = [
            folder.to_dict()
            for folder in folder_service.list_all(user_id)
        ]
        return jsonify({"response": folders})


    @jwt_required
    def post(self):
        # Extract folder settings from JSON request
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "subject", "accentColor")

        user_id = get_jwt_identity()
        
        # Save new folder to database
        folder = folder_service.create(subject=data["subject"], accent_color=data["accentColor"], user_id=user_id, folder_id=data.get("id"))
        return jsonify({"folder": folder.id, "cardCount": 0}), 201


class FolderItemAPI(MethodView):
    """
    Handles operations on a single folder item:
    - DELETE: delete the folder from the database by its ID.
    """
    def delete(self, folder_id: str):
        folder_service.delete(folder_id)
        return jsonify({"message": "Folder deleted successfully."})


# Connect the route paths to our pluggable Folder views
folders_bp.add_url_rule("/folders", view_func=FolderCollectionAPI.as_view("folder_collection"))
folders_bp.add_url_rule("/folders/<string:folder_id>", view_func=FolderItemAPI.as_view("folder_item"))
