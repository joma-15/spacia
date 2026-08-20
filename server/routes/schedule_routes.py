"""HTTP controllers for study schedules."""

from flask import Blueprint, jsonify, request
from flask.views import MethodView

from services.schedule_service import ScheduleService
from validation import require_fields, require_json_object

# Blueprint for all schedule-related routes (study reminders)
schedules_bp = Blueprint("schedules", __name__)
schedule_service = ScheduleService()


class ScheduleCollectionAPI(MethodView):
    """
    Handles operations on the whole schedules collection:
    - GET: list all study schedules.
    - POST: create a new study schedule with study settings (folder, cards, time, frequency).
    """

    REQUIRED_FIELDS = (
        "folderId",
        "folderName",
        "cardIds",
        "scheduleType",
        "time",
        "durationMinutes",
        "intervalMinutes",
        "createdAt",
    )

    def get(self):
        # Fetch schedules from database and convert them to dictionary format
        schedules = [schedule.to_dict() for schedule in schedule_service.list_all()]
        return jsonify(
            {
                "success": True,
                "data": schedules,
                "message": "Data fetched successfully.",
            }
        )

    def post(self):
        # Extract schedule data from JSON request and verify all required settings exist
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, *self.REQUIRED_FIELDS)

        # Save new schedule to database
        schedule = schedule_service.create(data)
        return jsonify({"success": True, "data": schedule.to_dict()}), 201


class ScheduleItemAPI(MethodView):
    """
    Handles operations on a single schedule item:
    - PATCH: turn a schedule on or off (enabled/disabled).
    - DELETE: delete the schedule permanently.
    """

    def patch(self, schedule_id: str):
        # Verify and extract the 'enabled' field from request
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "enabled")

        # Update status in database
        schedule = schedule_service.set_enabled(schedule_id, data["enabled"])
        return jsonify({"success": True, "data": schedule.to_dict()})

    def delete(self, schedule_id: str):
        schedule_service.delete(schedule_id)
        return jsonify({"success": True, "message": "Schedule deleted successfully."})


# Connect route paths to pluggable Schedule views
schedules_bp.add_url_rule(
    "/schedules", view_func=ScheduleCollectionAPI.as_view("schedule_collection")
)
schedules_bp.add_url_rule(
    "/schedules/<string:schedule_id>",
    view_func=ScheduleItemAPI.as_view("schedule_item"),
)
