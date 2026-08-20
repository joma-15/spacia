from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from services.streak_service import StreakService

streak_bp = Blueprint("streak", __name__)


@streak_bp.get("/streak/dashboard")
@jwt_required()
def dashboard():
    month = request.args.get("month")
    if month is not None:
        try:
            datetime_month = datetime.strptime(month, "%Y-%m")
            month = datetime_month.strftime("%Y-%m")
        except ValueError:
            return (
                jsonify(
                    {
                        "code": "invalid_month",
                        "message": "month must use YYYY-MM format",
                    }
                ),
                400,
            )
    return jsonify(StreakService.dashboard(get_jwt_identity(), month))
