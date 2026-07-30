from extensions import db
from models.users import User
import bcrypt

class AuthService: 
    """
    This service handles the authentications/user acconts
    """

    def create(self, username : str, password : str, email : str):
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