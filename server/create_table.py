"""Create any missing database tables."""

from app import app
from extensions import db
from models.subscription import Subscription
from models.users import User

with app.app_context():
    db.create_all()
    # Backfill accounts created before subscriptions existed. New registrations
    # create this row in AuthService, also with the inactive default.
    existing_user_ids = {row.user_id for row in Subscription.query.with_entities(Subscription.user_id)}
    for user in User.query.all():
        if user.id not in existing_user_ids:
            db.session.add(Subscription(user_id=user.id, plan="free", status="cancelled"))
    db.session.commit()
    print("Database tables are up to date.")
