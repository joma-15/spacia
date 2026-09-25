"""Authenticated subscription-status endpoint."""

from flask import Blueprint, jsonify
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from services.subscription_service import SubscriptionService

subscriptions_bp = Blueprint("subscriptions", __name__)
subscription_service = SubscriptionService()


class CurrentSubscriptionAPI(MethodView):
    @jwt_required()
    def get(self):
        return jsonify({"subscription": subscription_service.get_for_user(get_jwt_identity())})


subscriptions_bp.add_url_rule(
    "/subscriptions/me", view_func=CurrentSubscriptionAPI.as_view("current_subscription")
)
