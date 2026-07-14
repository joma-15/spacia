from extensions import db
import uuid
from sqlalchemy.sql import func

class Flashcard(db.Model): 
    """
    Represents the 'flashcards' table in our database.
    Each flashcard is a single question-and-answer pair belonging to a subject folder.
    """
    __tablename__="flashcards"

    # Unique identifier for the card (using UUID, a randomly generated string of 36 characters)
    id = db.Column(
        db.String(36), 
        primary_key = True, 
        default=lambda: str(uuid.uuid4())
    )

    folder = db.relationship(
        "Folder",
         back_populates="flashcards"
    )

    # Links this card to a folder (ForeignKey). If a folder is deleted, its cards must be cleaned up.
    folder_id = db.Column(
        db.String(36), 
        db.ForeignKey("folders.id"), 
        nullable=False
    )

    # The front of the card (the prompt/question)
    question = db.Column(
        db.Text, 
        nullable=False
    )

    # The back of the card (the answer)
    answer = db.Column(
        db.Text,
        nullable=False
    )

    # Study state. SQLAlchemy restricts this to only 'review' or 'understood'.
    status = db.Column(
        db.Enum('review', 'understood'), 
        nullable=True
    )

    # When the card was created. Filled in automatically by the database server.
    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now()
    )

    # When the card was last edited. Automatically updates itself whenever columns change.
    updated_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    def to_dict(self) -> dict:
        """
        Converts the database object into a Python dictionary.
        This allows Flask to easily transform the data into a JSON string to send to the client app.
        """
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "folder_id": self.folder_id,
            "status": self.status,
        }
