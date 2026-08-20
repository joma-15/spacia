from datetime import datetime, timezone

from extensions import db
from models.studysessions import StudySession


class StudySessionService:
    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        """Treat legacy naive database values as UTC and normalize all input."""
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @classmethod
    def start_session(
        cls, user_id: str, started_at: datetime
    ) -> tuple[StudySession, bool]:
        active_session = (
            StudySession.query.filter_by(user_id=user_id, ended_at=None)
            .order_by(StudySession.started_at.desc())
            .first()
        )
        if active_session:
            return active_session, False

        session = StudySession(
            user_id=user_id,
            started_at=cls._as_utc(started_at),
            ended_at=None,
            duration_seconds=None,
        )
        try:
            db.session.add(session)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return session, True

    @classmethod
    def end_session(
        cls, user_id: str, ended_at: datetime, session_id: int | None = None
    ) -> StudySession:
        query = StudySession.query.filter_by(user_id=user_id, ended_at=None)
        if session_id is not None:
            query = query.filter_by(id=session_id)
        session = query.order_by(StudySession.started_at.desc()).first()
        if not session:
            raise ValueError("No active study session found")

        normalized_ended_at = cls._as_utc(ended_at)
        normalized_started_at = cls._as_utc(session.started_at)
        session.ended_at = normalized_ended_at
        session.duration_seconds = max(
            0, int((normalized_ended_at - normalized_started_at).total_seconds())
        )
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return session
