from extensions import db
from models.flashcard import Flashcard
from flask import jsonify


def add_flashcard(question : str, answer : str, status : str, folder_id : str):
    try: 
        flashcard = Flashcard(
            question=question, 
            answer=answer, 
            status=status,
            folder_id=folder_id 
        )
        db.session.add(flashcard)
        db.session.commit()

    except Exception as e: 
        db.session.rollback()
        raise RuntimeError("Error:", str(e))
    
def delete_flashcard(flashcard_id : str): 
    flashcard = Flashcard.query.get(flashcard_id)

    if flashcard is None: 
        return {"error" : "flashcard not found!"}
    
    db.session.delete(flashcard)
    db.session.commit()

    return {"message" : "flashcard deleted successfully"}, 200

def update_flashcard_status(flashcard_id : str, status): 
   flashcard = Flashcard.query.get(flashcard_id)

   if flashcard is None: 
       return jsonify({"error" : "flashcard not found"}), 404
   
   flashcard.status = status
   db.session.commit()

   return jsonify({"message" : "updated successfully"})

