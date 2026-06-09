from flask import Blueprint, jsonify
from services.flashcard_service import generate_flashcards
import json

flashcards_bp = Blueprint("flashcards", __name__)


@flashcards_bp.route("/flashcards", methods=["GET"])
def get_flashcards():
    raw = generate_flashcards()

    try:
        flashcards = json.loads(raw)
    except:
        return jsonify({
            "success": False,
            "error": "Invalid JSON from AI",
            "raw": raw
        })

    return jsonify({
        "success": True,
        "flashcards": flashcards
    })