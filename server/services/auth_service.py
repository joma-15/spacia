from extensions import db
from models.users import User
from sqlalchemy import or_
from flask_jwt_extended import create_access_token, create_refresh_token
import bcrypt
from errors import ApiError

class AuthService: 
    """
    This service handles the authentications/user acconts
    """

    def register(self, username : str, password : str, email : str):
        if len(password) < 8:
            raise ApiError("Password must contain at least 8 characters", 400, code="weak_password")

        # Check for existing user records to return explicit errors
        if User.query.filter_by(username=username).first():
            raise ApiError("Username already exists", 400, code="username_taken")

        if User.query.filter_by(email=email).first():
            raise ApiError("An account with this email already exists", 400, code="email_taken")

        #hash the password first before storing it to the database 
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), 
            bcrypt.gensalt()
        ).decode("utf-8")

        user = User(
            username=username, 
            password_hash = password_hash, 
            email=email
        )
        try: 
            db.session.add(user)
            db.session.commit()
            return user
        except:
            db.session.rollback()
            raise

    def login(self,identifier : str, password : str):
        user = User.query.filter(
            or_(
                User.username == identifier, 
                User.email == identifier
            )
        ).first()

        if user is None: 
            raise ApiError("Incorrect username or password", 401, code="invalid_credentials")

        if not bcrypt.checkpw(
            password.encode('utf-8'), 
            user.password_hash.encode('utf-8')
        ): 
            raise ApiError("Incorrect username or password", 401, code="invalid_credentials")

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return {
            "message": "login successfully", 
            "access_token" : access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id, 
                "username": user.username, 
                "email": user.email
            }
        }
