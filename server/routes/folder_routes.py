from flask import Blueprint, request, jsonify
from services.folder_service import save_folder_to_db

folders_bp = Blueprint("folders", __name__)

@folders_bp.route("/folders", methods=["POST"])
def folder_route(): 
    data = request.get_json()

    subject = data["subject"]
    accent_color = data["accentColor"]

    print(subject)
    print(accent_color)

    folder= save_folder_to_db(subject, accent_color)

    return jsonify({
        "id": folder,
        "subject": subject, 
        "accentColor": accent_color, 
        "cardCount": 0
    }), 201