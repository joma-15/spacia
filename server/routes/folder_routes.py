"""HTTP controllers for folders."""

from flask import Blueprint, jsonify, request
from flask.views import MethodView

from services.folder_service import FolderService
from validation import require_fields, require_json_object

folders_bp = Blueprint("folders", __name__)
folder_service = FolderService()


class FolderCollectionAPI(MethodView):
    def get(self):
        folders = [folder.to_dict() for folder in folder_service.list_all()]
        return jsonify({"response": folders, "cardCount": 0})

    def post(self):
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "subject", "accentColor")
        folder = folder_service.create(data["subject"], data["accentColor"])
        return jsonify({"folder": folder.id, "cardCount": 0}), 201


class FolderItemAPI(MethodView):
    def delete(self, folder_id: str):
        folder_service.delete(folder_id)
        return jsonify({"message": "Folder deleted successfully."})


folders_bp.add_url_rule("/folders", view_func=FolderCollectionAPI.as_view("folder_collection"))
folders_bp.add_url_rule("/folders/<string:folder_id>", view_func=FolderItemAPI.as_view("folder_item"))
