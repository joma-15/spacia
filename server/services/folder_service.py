from extensions import db
from models.folders import Folder

def save_folder_to_db(subject: str, accent_color: str):
    try:
        folder = Folder(
            subject=subject,
            accent_color=accent_color,
            user_id="66b851ba-e806-4eae-b109-ef676b9ca64b"
        )

        db.session.add(folder)
        db.session.commit()

        print("folder saved success")

        return folder

    except Exception as e:
        db.session.rollback()
        print("Error:", e)
        return None
    
def get_folder_data():
    try:
        folders = Folder.query.all()

        return [
            {
                "id": f.id,
                "subject": f.subject,
                "accentColor": f.accent_color,
            }
            for f in folders
        ]

    except Exception as e:
        print("Error:", e)
        return []
    

def delete_folder(foler_id : str):
    folder = Folder.query.get(foler_id) 

    if folder is None: 
        return {"error": "folder not found"}
    
    db.session.delete(folder)
    db.session.commit()

    return {"message": "folder deteted successfully"}, 200
