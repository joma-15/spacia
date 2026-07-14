from extensions import db
import uuid
from sqlalchemy.sql import func

class Folder(db.Model): 
    __tablename__="folders"

    flashcards = db.relationship(
        "Flashcard",
        back_populates="folder",
        cascade="all, delete-orphan"
    )

    id = db.Column(
        db.String(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id"),
        nullable=False, 
    )

    subject = db.Column(
        db.String(100), 
        nullable=False
    )

    accent_color = db.Column(
        db.String(20),
        nullable=False
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
            "subject": self.subject,
            "accentColor": self.accent_color,
            "cardCount": len(self.flashcards),
        }
