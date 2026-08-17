from extensions import db
from sqlalchemy.sql import func


class StudySession(db.Model):
    __tablename__ = "study_sessions"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    started_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    ended_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    duration_seconds = db.Column(
        db.Integer,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=func.now()
    )

    user = db.relationship(
        "User",
        back_populates="study_sessions"
    )