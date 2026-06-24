from pprint import pprint
from extensions import db
from models.schedules import Schedule
from app import create_app

app = create_app()

with app.app_context():
    schedules = Schedule.query.all()

    result = [
        {
            "id": s.id,
            "folder_id": s.folder_id,
            "folder_name": s.folder_name,
            "card_ids": s.card_ids,
            "schedule_type": s.schedule_type,
            "custom_days": s.custom_days,
            "time": s.time,
            "duration_minutes": s.duration_minutes,
            "interval_minutes": s.interval_minutes,
            "shuffle": s.shuffle,
            "enabled": s.enabled,
            "created_at": s.created_at,
        }
        for s in schedules
    ]

    pprint(result, sort_dicts=False)