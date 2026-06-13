from extensions import db
from models.folders import Folder

def save_folder_to_db(name: str, accent_color: str):
    try:
        folder = Folder(
            name=name,
            accent_color=accent_color,
            user_id="66b851ba-e806-4eae-b109-ef676b9ca64b"
        )

        db.session.add(folder)
        db.session.commit()

        print("folder saved success")

        return folder.id

    except Exception as e:
        db.session.rollback()
        print("Error:", e)
        return None