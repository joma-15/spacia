"""HTTP controllers for users"""

from flask import Blueprint, jsonify, request
from flask.views import MethodView

from services.auth_service import AuthService
from validation import require_fields, require_json_object

#Blueprint for all user-related routes
auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()

class RegisterAPI(MethodView): 
    def post(self): 
        print("post funcition was being triggered")
        data = request.get_json()

        print(data)

        return {"message" : "received"}

#connect the route paths to our pluggalbe userview
auth_bp.add_url_rule("/auth/register", view_func=RegisterAPI.as_view("register"))