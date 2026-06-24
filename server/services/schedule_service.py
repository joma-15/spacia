#this is the data logic for showing the set flashcard as a notification 

from typing import Dict
from extensions import db
from models.schedules import Schedule

def add_data(data: Dict[str, any]): 
    schedule = Schedule(
        folder_id=data["folderId"],
        folder_name=data["folderName"],
        card_ids=data["cardIds"],
        schedule_type=data["scheduleType"],
        custom_days=data["customDays"],
        time=data["time"],
        duration_minutes=data["durationMinutes"],
        interval_minutes=data["intervalMinutes"],
        shuffle=data["shuffle"],
        enabled=data["enabled"],
        created_at=data["createdAt"]
    )

    db.session.add(schedule)
    db.session.commit()

    return schedule

def get_data():
    schedule_folders = Schedule.query.all()

    return [
        {
            "id": s.id,
            "folderId": s.folder_id,
            "folderName": s.folder_name,
            "cardIds": s.card_ids,
            "scheduleType": s.schedule_type,
            "customDays": s.custom_days,
            "time": s.time,
            "durationMinutes": s.duration_minutes,
            "intervalMinutes": s.interval_minutes,
            "shuffle": s.shuffle,
            "enabled": s.enabled,
            "createdAt": s.created_at,
        }
        for s in schedule_folders
    ]

    
    