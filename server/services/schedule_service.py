"""Business operations for scheduled study reminders."""

from extensions import db
from errors import NotFoundError
from models.schedules import Schedule


class ScheduleService:
    """
    This service handles all database actions for study schedules (reminders).
    It manages when users want to be reminded to study a particular folder of cards.
    """

    def create(self, data: dict) -> Schedule:
        """
        Creates a new study reminder schedule in the database.
        The client app (React Native) uses "camelCase" naming (like folderId),
        but our Python database uses "snake_case" naming (like folder_id).
        This function maps the incoming fields to the correct database model fields.
        """
        schedule = Schedule(
            folder_id=data["folderId"],
            folder_name=data["folderName"],
            card_ids=data["cardIds"],
            schedule_type=data["scheduleType"],
            custom_days=data.get("customDays", []),
            time=data["time"],
            duration_minutes=data["durationMinutes"],
            interval_minutes=data["intervalMinutes"],
            shuffle=data.get("shuffle", True),
            enabled=data.get("enabled", True),
            created_at=data["createdAt"],
        )
        db.session.add(schedule)
        db.session.commit()
        return schedule

    def list_all(self) -> list[Schedule]:
        """
        Returns all schedules in the database, ordered starting from the newest.
        """
        return Schedule.query.order_by(Schedule.created_at.desc()).all()

    def set_enabled(self, schedule_id: str, enabled: bool) -> Schedule:
        """
        Enables or disables a study reminder schedule (toggles it on/off).
        Only updates the 'enabled' field to ensure other settings (like time or duration)
        are not accidentally modified.
        """
        schedule = self._get_or_raise(schedule_id)
        schedule.enabled = enabled
        db.session.commit()
        return schedule

    def delete(self, schedule_id: str) -> None:
        """
        Removes a schedule from the database permanently.
        """
        db.session.delete(self._get_or_raise(schedule_id))
        db.session.commit()

    @staticmethod
    def _get_or_raise(schedule_id: str) -> Schedule:
        """
        Helper method to find a schedule by its ID.
        If it cannot find it, it raises a NotFoundError which turns into a 404 response.
        """
        schedule = db.session.get(Schedule, schedule_id)
        if schedule is None:
            raise NotFoundError("Schedule")
        return schedule
