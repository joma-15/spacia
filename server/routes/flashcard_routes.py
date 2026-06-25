# routes/pdf_routes.py
from flask import Blueprint, jsonify, request
from services.ai_flashcard_service import generate_flashcards, get_flashcards_by_folder
from services.flashcard_services import add_flashcard, delete_flashcard, update_flashcard_status, delete_all

flashcards_bp = Blueprint("flashcards", __name__)

# ── AI Generation (non-blocking) ───────────────────────────────────────────────
@flashcards_bp.route("/flashcards/<folder_id>", methods=["GET"])
def get_flashcards(folder_id):
    try:
        generate_flashcards(folder_id, r"D:\download\burat.pdf")

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
    
#saved flashcard that is manually add by the user to the database 
@flashcards_bp.route("/flashcards/<folder_id>/manualSaved", methods=["POST"])
def post_flashcard(folder_id : str): 
    data = request.get_json()

    question = data["question"]
    answer = data["answer"]
    status = data["status"]

    # print(question)
    # print(answer)
    # print(folder_id)
    # print(status)

    add_flashcard(question, answer, status, folder_id)
    
    return jsonify({"message": "flashcard created"})

@flashcards_bp.route("/flashcards/<flashcard_id>", methods=["DELETE"])
def flashcard_delete(flashcard_id : str): 
    try: 
        return delete_flashcard(flashcard_id)
    except Exception as e: 
        return jsonify({
            "success": False, 
            "error": str(e)
        })
    
@flashcards_bp.route("/flashcards/<flashcard_id>", methods=["PATCH"])
def flashcard_update(flashcard_id : str): 
    try: 
        data = request.get_json()
        status = data["status"]
        
        return update_flashcard_status(flashcard_id, status)
    except Exception as e: 
        return jsonify({"error" : str(e)})
    

@flashcards_bp.route("/flashcards/folder/<folder_id>", methods=["DELETE"])
def delete_all_flashcards(folder_id: str): 
    try: 
        delete_all(folder_id)

        return jsonify({
            "success": True, 
            "message": "deleted successfully"
        })
    
    except Exception as e: 
        return jsonify({
            "message": "cant delete data",
            "success": False
        })