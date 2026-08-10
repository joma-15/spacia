"""HTTP controllers for study sessions."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.study_session_service import StudySessionService


# Blueprint
studysession_bp = Blueprint(
    "studySessions",
    __name__
)

studysession_service = StudySessionService


class StudySessionController:

    @staticmethod
    @jwt_required()
    def start_session():
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400

        start_time = data.get("startTime")

        if not start_time:
            return jsonify({
                "success": False,
                "message": "startTime is required"
            }), 400

        try:
            started_at = datetime.fromisoformat(
                start_time.replace("Z", "+00:00")
            )
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Invalid startTime format"
            }), 400

        user_id = get_jwt_identity()

        try:
            session = StudySessionService.start_session(
                user_id=user_id,
                started_at=started_at
            )

            return jsonify({
                "success": True,
                "message": "Study session started",
                "session_id": session.id,
                "started_at": session.started_at.isoformat()
            }), 201

        except Exception:
            return jsonify({
                "success": False,
                "message": "Failed to start study session"
            }), 500

    @staticmethod
    @jwt_required()
    def end_session():
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400

        end_time = data.get("endTime")

        if not end_time:
            return jsonify({
                "success": False,
                "message": "endTime is required"
            }), 400

        try:
            ended_at = datetime.fromisoformat(
                end_time.replace("Z", "+00:00")
            )
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Invalid endTime format"
            }), 400

        user_id = get_jwt_identity()

        try:
            session = StudySessionService.end_session(
                user_id=user_id,
                ended_at=ended_at
            )

            return jsonify({
                "success": True,
                "message": "Study session ended",
                "session_id": session.id,
                "started_at": session.started_at.isoformat(),
                "ended_at": session.ended_at.isoformat(),
                "duration_seconds": session.duration_seconds
            }), 200

        except ValueError as error:
            return jsonify({
                "success": False,
                "message": str(error)
            }), 404

        except Exception:
            return jsonify({
                "success": False,
                "message": "Failed to end study session"
            }), 500


# Routes
@studysession_bp.route("/study-session/start", methods=["POST"])
def start_study_session():
    return StudySessionController.start_session()


@studysession_bp.route("/study-session/end", methods=["POST"])
def end_study_session():
    return StudySessionController.end_session()