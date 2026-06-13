from extensions import db
from models.users import User
from app import create_app

app = create_app()

def register_user(): 
    username = input("username : ")
    email = input("email : ")
    password = input("password : ")

    #give access to the flask environment 
    with app.app_context(): 
        try: 
            user = User(
                username=username, 
                email=email, 
                password_hash=password
            )
            db.session.add(user)
            db.session.commit()
            print("registered user successfully!")

        except Exception as e: 
            db.session.rollback()
            print("Error ", e)


def login_user(): 
    username = input("log username : ")
    email = input("log email : ")
    password = input("log password : ")

    #give access to the flask app 
    with app.app_context(): 
        try: 
            #find the user 
            user = User.query.filter_by(username=username).first()

            #pag walang nireturn na value 
            if not user: 
                print("user not available in the database")
                return

            if password == user.password_hash and email == user.email: 
                print("login successfull")
            else: 
                print("login failed")
                return

        except Exception as e : 
            print("Error ", e)


def logic_test(): 
    decision = input("login or sign up : ")

    if decision == "login": 
        login_user()
    
    if decision == "register": 
        register_user()


logic_test()