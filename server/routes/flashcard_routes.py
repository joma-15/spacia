# routes/pdf_routes.py
from flask import Blueprint, jsonify
from services.flashcard_service import generate_flashcards, get_flashcards_by_folder
import threading

flashcards_bp = Blueprint("flashcards", __name__)

# ── AI Generation (non-blocking) ───────────────────────────────────────────────
@flashcards_bp.route("/flashcards/<folder_id>", methods=["GET"])
def get_flashcards(folder_id):
    try:
        # Start generation in background thread
        thread = threading.Thread(
            target=generate_flashcards,
            args=(folder_id, r"D:\download\burat.pdf")
        )
        thread.daemon = True
        thread.start()

        # Return immediately — don't wait for Groq
        return jsonify({"message": "Flashcard generation started"}), 202

    except Exception as e:
        print("Route error:", e)
        return jsonify({"error": str(e)}), 500


# ── Fetch Saved Cards (no AI) ──────────────────────────────────────────────────
@flashcards_bp.route("/flashcards/<folder_id>/saved", methods=["GET"])
def get_saved_flashcards(folder_id):
    try:
        flashcards = get_flashcards_by_folder(folder_id)
        return jsonify([
            {
                "id": card.id,
                "question": card.question,
                "answer": card.answer,
                "folder_id": card.folder_id,
                "status": card.status,
            }
            for card in flashcards
        ])

    except Exception as e:
        print("Route error:", e)
        return jsonify({"error": str(e)}), 500