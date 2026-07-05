from flask import Blueprint, request, jsonify
from services.folder_service import save_folder_to_db, get_folder_data,delete_folder

folders_bp = Blueprint("folders", __name__)

@folders_bp.route("/folders", methods=["POST", "GET"])
def folder(): 
    if request.method == "POST": 
        data = request.get_json()

        subject = data["subject"]
        accent_color = data["accentColor"]

        folder= save_folder_to_db(subject, accent_color)

        return jsonify({
            "folder": folder.id,
            "cardCount": 0
        }), 201
    
    elif request.method == "GET": 
        try:
            folders = get_folder_data() 
            print(folders)

            return jsonify({
                "response": folders,
                "cardCount": 0
            })
        except Exception as e :
            return jsonify({
                "success": False, 
                "error": "cannot fetch data"
            }), 500 


@folders_bp.route("/folders/<folder_id>", methods=["DELETE"])
def remove_folder(folder_id):
    try: 
        return delete_folder(folder_id)
    except Exception as e: 
        return jsonify({
            "success": False, 
            "error": str(e)
        }) 

