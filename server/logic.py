from extensions import db
from models.users import User
from models.folders import Folder
from app import create_app

app = create_app()

def show_current_folder(): 
    with app.app_context(): 
        try: 
            folders = Folder.query.all()
        except Exception as e: 
            print("Error : ", e)
    count = 1

    for folder in folders: 
        print(f"{count}Folder")
        print(f"name : {folder.name}")
        print(f"color : {folder.accent_color}")
        print("------------\n")
        count += 1


def show_dashboard(username : str): 
    user = User.query.filter_by(username=username).first()

    while(True): 
        add_folder = input("Add folder (yes/no) : ")

        if add_folder == "yes":  
            folder_name = input("folder name : ")
            accent_color = input("accent color : ")

            with app.app_context(): 
                try: 
                    folder = Folder(
                        user_id=user.id,
                        name=folder_name,
                        accent_color=accent_color
                    )

                    db.session.add(folder)
                    db.session.commit()
                    print("folder added to the database")

                except Exception as e: 
                    print("Error ", e)

            choice = input("do you want to add more?(yes/no) : ")
            
            if choice == "no": 
                show_current_folder()
                break

        if add_folder == "no":
            show_current_folder()
            break

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
            print("registered user successfully\n\n!")

            show_dashboard(username)
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
                print("login successfull\n\n")

                show_dashboard(username)
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