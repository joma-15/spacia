"""Server-side streak dashboard calculations based on completed study sessions."""

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import selectinload

from extensions import db
from models.flashcard import Flashcard
from models.folders import Folder
from models.studysessions import StudySession


class StreakService:
    DAILY_SESSION_GOAL = 1

    @staticmethod
    def _utc_date(value: datetime) -> str:
        if value.tzinfo is None:
            return value.date().isoformat()
        return value.astimezone(timezone.utc).date().isoformat()

    @classmethod
    def dashboard(cls, user_id: str, month: str | None = None) -> dict:
        completed = (
            StudySession.query
            .filter(
                StudySession.user_id == user_id,
                StudySession.ended_at.isnot(None),
                StudySession.duration_seconds.isnot(None),
            )
            .order_by(StudySession.ended_at.asc())
            .all()
        )
        study_dates = sorted({cls._utc_date(session.ended_at) for session in completed})
        today = datetime.now(timezone.utc).date().isoformat()

        current_streak = 0
        cursor = datetime.now(timezone.utc).date()
        study_date_set = set(study_dates)
        while cursor.isoformat() in study_date_set:
            current_streak += 1
            cursor = cursor.fromordinal(cursor.toordinal() - 1)

        longest_streak = 0
        run = 0
        previous = None
        for date_string in study_dates:
            date = datetime.fromisoformat(date_string).date()
            run = run + 1 if previous and (date - previous).days == 1 else 1
            longest_streak = max(longest_streak, run)
            previous = date

        year, selected_month = map(int, (month or today[:7]).split("-"))
        month_prefix = f"{year:04d}-{selected_month:02d}-"
        monthly_activity = {date for date in study_dates if date.startswith(month_prefix)}
        today_sessions = sum(1 for session in completed if cls._utc_date(session.ended_at) == today)

        folders = (
            Folder.query.options(selectinload(Folder.flashcards))
            .filter_by(user_id=user_id)
            .order_by(Folder.updated_at.desc())
            .all()
        )
        folder_summaries = []
        for folder in folders:
            cards = folder.flashcards
            understood = sum(card.status == "understood" for card in cards)
            folder_summaries.append({
                "id": folder.id,
                "title": folder.subject,
                "color": folder.accent_color,
                "total_cards": len(cards),
                "understood_cards": understood,
            })

        cards_reviewed = (
            db.session.query(func.count(Flashcard.id))
            .join(Folder)
            .filter(Folder.user_id == user_id, Flashcard.status == "understood")
            .scalar()
            or 0
        )
        total_seconds = (
            db.session.query(func.coalesce(func.sum(StudySession.duration_seconds), 0))
            .filter(
                StudySession.user_id == user_id,
                StudySession.ended_at.isnot(None),
                StudySession.duration_seconds.isnot(None),
            )
            .scalar()
            or 0
        )
        total_minutes = total_seconds // 60

        achievements = [
            {
                "id": "first-folder",
                "title": "First Folder",
                "description": "Create your first flashcard folder.",
                "icon": "folder-star-outline",
                "progress": len(folders),
                "target": 1,
            },
            {
                "id": "week-streak",
                "title": "7 Day Streak",
                "description": "Study every day for a full week.",
                "icon": "fire",
                "progress": longest_streak,
                "target": 7,
            },
        ]

        return {
            "streak": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_active_date": study_dates[-1] if study_dates else None,
            },
            "statistics": {
                "cards_reviewed": cards_reviewed,
                "games_played": len(completed),
                "study_time_minutes": total_minutes,
                "xp_earned": 0,
            },
            "daily_goal": {"target": cls.DAILY_SESSION_GOAL, "completed": today_sessions},
            "calendar": sorted(monthly_activity),
            "folders": folder_summaries,
            "achievements": achievements,
            "challenge": {
                "id": "daily-study-session",
                "title": "Today's Study Goal",
                "description": "Complete a study session today.",
                "reward_xp": 0,
                "progress": today_sessions,
                "target": cls.DAILY_SESSION_GOAL,
                "completed": today_sessions >= cls.DAILY_SESSION_GOAL,
            },
        }
