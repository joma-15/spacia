from services.schedule_service import add_data
from flask import Blueprint, request, jsonify

schedules_bp = Blueprint("schedules", __name__)

@schedules_bp.route("/schedules", methods=["POST"])
def add_sched(): 
    try: 
        data = request.get_json()

        add_data(data)
        return jsonify({
            "data" : data
        })
    except Exception as e: 
        return jsonify({
            "message": str(e), 
            "success": False
        })