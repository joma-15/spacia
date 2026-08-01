"""Business operations for subject folders."""

from extensions import db
from errors import NotFoundError
from models.folders import Folder
from models.users import User


class FolderService:
    """Coordinates folder persistence without leaking ORM details to routes."""

    # TODO: replace this temporary owner with the authenticated user identity.
    # DEFAULT_USER_ID = "66b851ba-e806-4eae-b109-ef676b9ca64b"

    def create(self, subject: str, accent_color: str,user_id : str, folder_id: str | None = None) -> Folder:
        folder = Folder(
            id=folder_id,
            subject=subject.strip(),
            accent_color=accent_color,
            user_id=user_id,
        )
        db.session.add(folder)
        db.session.commit()
        return folder

    def list_all(self, user_id : str) -> list[Folder]: 
        return(
            Folder.query
            .filter_by(user_id=user_id)
            .order_by(Folder.created_at.desc())
            .all()
        )

    def delete(self, folder_id: str) -> None:
        folder = db.session.get(Folder, folder_id)
        if folder is None:
            raise NotFoundError("Folder")

        db.session.delete(folder)
        db.session.commit()
