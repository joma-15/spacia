from flask import Blueprint, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from services.auth_service import AuthService
from validation import require_fields, require_json_object

#Blueprint for all user-related routes
auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()

class RegisterAPI(MethodView): 
    def post(self): 
        data = require_json_object(request.get_json(silent=True))
        require_fields(data, "username", "email", "password")

        username = data["username"]
        password = data["password"]
        email = data["email"]

        user = auth_service.register(username, password, email)
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            "message": "registered successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 201

class LoginAPI(MethodView): 
    def post(self): 
        data = require_json_object(request.get_json())

        identifier = data["identifier"]
        password = data["password"]

        result = auth_service.login(identifier, password)

        return jsonify(result)


class RefreshAPI(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        return jsonify({"access_token": create_access_token(identity=get_jwt_identity())})

#connect the route paths to our pluggalbe userview
auth_bp.add_url_rule("/auth/register", view_func=RegisterAPI.as_view("register"))
auth_bp.add_url_rule("/auth/login", view_func=LoginAPI.as_view("login"))
auth_bp.add_url_rule("/auth/refresh", view_func=RefreshAPI.as_view("refresh"))
