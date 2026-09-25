"""Read-only subscription status for the authenticated account."""

from models.subscription import Subscription


class SubscriptionService:
    def get_for_user(self, user_id: str) -> dict:
        subscription = Subscription.query.filter_by(user_id=user_id).order_by(Subscription.started_at.desc()).first()
        if not subscription:
            # Accounts created before this feature have no row until the supplied
            # migration is applied. Treat them safely as unsubscribed.
            return {"status": "cancelled", "plan": "free", "isSubscribed": False}
        return subscription.to_dict()
