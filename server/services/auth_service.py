from extensions import db
from models.users import User

class AuthService: 
    """
    This service handles the authentications/user acconts
    """

    def create(self, username : str, password_hash : str, email : str): 
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