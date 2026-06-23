#this is the data logic for showing the set flashcard as a notification 

from typing import Dict
from extensions import db
from models.schedules import Schedule

def add_data(data: Dict[str, any]): 
    schedule = Schedule(
        id=data["id"],
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