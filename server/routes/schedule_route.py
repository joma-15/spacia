from services.schedule_service import add_data, get_data, update_data, delete_data
from flask import Blueprint, request, jsonify

schedules_bp = Blueprint("schedules", __name__)

@schedules_bp.route("/schedules", methods=["POST"])
def add_sched(): 
    try: 
        data = request.get_json()

        if not data: 
            return jsonify({
                "success": False, 
                "message": "cant post to the database"
            }),400

        add_data(data)
        return jsonify({
            "success": True,
            "data" : data
        })
    except Exception as e: 
        return jsonify({
            "message": str(e), 
            "success": False
        })
    
@schedules_bp.route("/schedules", methods=["GET"])
def get_sched(): 
    try: 
        #fetch the data from the database 
        data = get_data()
        return jsonify({
            "success": True,
            "data" : data,
            "message": "data fetched successfully"
        }),200
    
    except Exception as e: 
        return jsonify({
            "success": False,
            "error" : str(e), 
            "message": "cant get the data to dabatase "
        }),500
    

@schedules_bp.route("/schedules/<schedule_id>", methods=["PATCH"])
def update_toggle(schedule_id : str): 
    try: 
        data = request.get_json()
        print(data)
        print(schedule_id)

        return update_data(schedule_id, data["enabled"])
    except Exception as e: 
        return jsonify({
            "message": str(e), 
            "success": False
        })
    
@schedules_bp.route("/schedules/<schedule_id>", methods=["DELETE"])
def delete_schedule(schedule_id : str): 
    try: 
        return delete_data(schedule_id)

    except Exception as e: 
        return jsonify({
            "message": "error deleting the data", 
            "success": False
        })