from extensions import db
from models.flashcard import Flashcard


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
