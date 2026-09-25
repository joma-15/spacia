"""Server-authoritative subscription status for a single user."""

from extensions import db
from sqlalchemy.sql import func
import uuid


class Subscription(db.Model):
    __tablename__ = "subscriptions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # These values match the subscriptions table already present in production.
    # New accounts are explicitly free/cancelled until an administrator grants access.
    plan = db.Column(db.Enum("free", "monthly", "annual"), nullable=False, default="free")
    status = db.Column(db.Enum("active", "expired", "cancelled"), nullable=True, default="cancelled")
    started_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "plan": self.plan,
            "isSubscribed": self.status == "active" and self.plan in {"monthly", "annual"},
        }
