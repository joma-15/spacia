from extensions import db
from models.users import User
from sqlalchemy import or_
from flask_jwt_extended import create_access_token, create_refresh_token
import bcrypt
import time
from errors import ApiError


class AuthService:
    """
    This service handles the authentications/user acconts
    """

    def register(self, username: str, password: str, email: str):
        if len(password) < 8:
            raise ApiError(
                "Password must contain at least 8 characters", 400, code="weak_password"
            )

        # Check for existing user records to return explicit errors
        if User.query.filter_by(username=username).first():
            raise ApiError("Username already exists", 400, code="username_taken")

        if User.query.filter_by(email=email).first():
            raise ApiError(
                "An account with this email already exists", 400, code="email_taken"
            )

        # hash the password first before storing it to the database
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        user = User(username=username, password_hash=password_hash, email=email)
        try:
            db.session.add(user)
            db.session.commit()
            return user
        except:
            db.session.rollback()
            raise

    def login(self,identifier : str, password : str):

        start = time.perf_counter()

        # user = User.query.filter(
        #     or_(
        #         User.username == identifier,
        #         User.email == identifier
        #     )
        # ).first()

        user = User.query.with_entities(
            User.id,
            User.username,
            User.email,
            User.password_hash
        ).filter(
            or_(
                User.username == identifier,
                User.email == identifier
        )
    ).first()

        #added for performance calculation 
        after_db = time.perf_counter()

        if user is None:
            raise ApiError("Incorrect username or password", 401, code="invalid_credentials")

        if not bcrypt.checkpw(
            password.encode('utf-8'),
            user.password_hash.encode('utf-8')
        ):
            raise ApiError("Incorrect username or password", 401, code="invalid_credentials")

        after_bcrypt = time.perf_counter()

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        after_jwt = time.perf_counter()

        # ADDED: Calculate how long each part took
        db_time = (after_db - start) * 1000
        bcrypt_time = (after_bcrypt - after_db) * 1000
        jwt_time = (after_jwt - after_bcrypt) * 1000
        total_time = (after_jwt - start) * 1000

                # ADDED: Print performance information
        print("\n========== LOGIN PERFORMANCE ==========")
        print(f"Database lookup : {db_time:.2f} ms")
        print(f"bcrypt check    : {bcrypt_time:.2f} ms")
        print(f"JWT generation  : {jwt_time:.2f} ms")
        print(f"TOTAL           : {total_time:.2f} ms")
        print("========================================\n")

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


