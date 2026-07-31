from extensions import db
from models.users import User
from sqlalchemy import or_
from flask_jwt_extended import create_access_token
import bcrypt

class AuthService: 
    """
    This service handles the authentications/user acconts
    """

    def register(self, username : str, password : str, email : str):
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
            return {"message": "invalid username or email"}

        if not bcrypt.checkpw(
            password.encode('utf-8'), 
            user.password_hash.encode('utf-8')
        ): 
            return {"message": "invalid password"}

        access_token = create_access_token(identity=user.id)

        return{
            "message": "login successfully", 
            "access_token" : access_token,
            "user": {
                "id": user.id, 
                "username": user.username, 
                "email": user.email
            }
        }
