from extensions import db
import uuid

class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))

    folder_id = db.Column(db.String(50), nullable=False)

    folder_name = db.Column(db.String(255), nullable=False)

    card_ids = db.Column(db.JSON, nullable=False)

    schedule_type = db.Column(db.String(50), nullable=False)

    custom_days = db.Column(db.JSON, nullable=True)

    time = db.Column(db.String(10), nullable=False)

    duration_minutes = db.Column(db.Integer, nullable=False)

    interval_minutes = db.Column(db.Integer, nullable=False)

    shuffle = db.Column(db.Boolean, nullable=False, default=True)

    enabled = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(db.BigInteger, nullable=False)
