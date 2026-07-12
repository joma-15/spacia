from extensions import db
import uuid
from sqlalchemy.sql import func

class Flashcard(db.Model): 
    __tablename__="flashcards"

    id = db.Column(
        db.String(36), 
        primary_key = True, 
         default=lambda: str(uuid.uuid4())
    )

    folder_id = db.Column(
        db.String(36), 
        db.ForeignKey("folders.id"), 
        nullable=False
    )

    question = db.Column(
        db.Text, 
        nullable=False
    )

    answer = db.Column(
        db.Text,
        nullable=False
    )

    status = db.Column(
        db.Enum('review', 'understood'), 
        nullable=True
    )

    
    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "folder_id": self.folder_id,
            "status": self.status,
        }
