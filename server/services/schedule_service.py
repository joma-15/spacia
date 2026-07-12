"""Business operations for scheduled study reminders."""

from extensions import db
from errors import NotFoundError
from models.schedules import Schedule


class ScheduleService:
    def create(self, data: dict) -> Schedule:
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
        return Schedule.query.order_by(Schedule.created_at.desc()).all()

    def set_enabled(self, schedule_id: str, enabled: bool) -> Schedule:
        schedule = self._get_or_raise(schedule_id)
        schedule.enabled = enabled
        db.session.commit()
        return schedule

    def delete(self, schedule_id: str) -> None:
        db.session.delete(self._get_or_raise(schedule_id))
        db.session.commit()

    @staticmethod
    def _get_or_raise(schedule_id: str) -> Schedule:
        schedule = db.session.get(Schedule, schedule_id)
        if schedule is None:
            raise NotFoundError("Schedule")
        return schedule
