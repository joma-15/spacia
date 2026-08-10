from datetime import datetime, timezone

from extensions import db
from models.studysessions import StudySession


def start_study_session(user_id, started_at):
    session = StudySession(
        user_id=user_id,
        started_at=started_at,
        ended_at=None,
        duration_seconds=None
    )

    db.session.add(session)
    db.session.commit()

    return session


def end_study_session(user_id, ended_at):
    session = StudySession.query.filter_by(
        user_id=user_id,
        ended_at=None
    ).order_by(
        StudySession.started_at.desc()
    ).first()

    if not session:
        raise ValueError("No active study session found")

    session.ended_at = ended_at

    duration = ended_at - session.started_at
    session.duration_seconds = int(duration.total_seconds())

    db.session.commit()

    return session