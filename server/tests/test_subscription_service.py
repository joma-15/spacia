import unittest

from app import create_app
from extensions import db
from models.subscription import Subscription
from models.users import User
from services.subscription_service import SubscriptionService


class SubscriptionServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.service = SubscriptionService()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_missing_subscription_is_unsubscribed(self):
        self.assertFalse(self.service.get_for_user("missing-user")["isSubscribed"])

    def test_active_subscription_is_subscribed(self):
        user = User(id="user-a", username="marcel", email="marcel@example.com", password_hash="hash")
        db.session.add(user)
        db.session.add(Subscription(user_id=user.id, status="active", plan="annual"))
        db.session.commit()

        result = self.service.get_for_user(user.id)
        self.assertTrue(result["isSubscribed"])
        self.assertEqual(result["plan"], "annual")


if __name__ == "__main__":
    unittest.main()
