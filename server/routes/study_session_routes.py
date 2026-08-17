from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from services.study_session_service import StudySessionService


studysession_bp = Blueprint("studySessions", __name__)


def parse_timestamp(value: object, field_name: str):
    if not isinstance(value, str) or not value:
        return None, (jsonify({"success": False, "message": f"{field_name} is required"}), 400)
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")), None
    except ValueError:
        return None, (jsonify({"success": False, "message": f"Invalid {field_name} format"}), 400)


def utc_isoformat(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat()


class StudySessionStartAPI(MethodView):
    @jwt_required()
    def post(self):
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "message": "Request body is required"}), 400

        started_at, error_response = parse_timestamp(data.get("startTime"), "startTime")
        if error_response:
            return error_response

        user_id = get_jwt_identity()
        current_app.logger.info("Starting study session for user %s", user_id[:8])
        try:
            session, created = StudySessionService.start_session(user_id, started_at)
        except Exception:
            current_app.logger.exception("Failed to start study session")
            return jsonify({"success": False, "message": "Failed to start study session"}), 500

        current_app.logger.info("Study session %s: %s", "created" if created else "reused", session.id)
        return jsonify({
            "success": True,
            "message": "Study session started" if created else "Study session already active",
            "session_id": session.id,
            "started_at": utc_isoformat(session.started_at),
            "created": created,
        }), 201 if created else 200


class StudySessionEndAPI(MethodView):
    @jwt_required()
    def post(self):
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "message": "Request body is required"}), 400

        ended_at, error_response = parse_timestamp(data.get("endTime"), "endTime")
        if error_response:
            return error_response

        session_id = data.get("sessionId")
        if session_id is not None and (not isinstance(session_id, int) or isinstance(session_id, bool)):
            return jsonify({"success": False, "message": "sessionId must be an integer"}), 400

        user_id = get_jwt_identity()
        current_app.logger.info("Ending study session for user %s", user_id[:8])
        try:
            session = StudySessionService.end_session(user_id, ended_at, session_id)
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 404
        except Exception:
            current_app.logger.exception("Failed to end study session")
            return jsonify({"success": False, "message": "Failed to end study session"}), 500

        current_app.logger.info("Study session updated: %s (%s seconds)", session.id, session.duration_seconds)
        return jsonify({
            "success": True,
            "message": "Study session ended",
            "session_id": session.id,
            "started_at": utc_isoformat(session.started_at),
            "ended_at": utc_isoformat(session.ended_at),
            "duration_seconds": session.duration_seconds,
        }), 200


studysession_bp.add_url_rule("/study-sessions/start", view_func=StudySessionStartAPI.as_view("study_session_start"))
studysession_bp.add_url_rule("/study-sessions/end", view_func=StudySessionEndAPI.as_view("study_session_end"))
