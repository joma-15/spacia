"""Authorization and persistence tests for the AI's controlled study tools."""

import unittest

from app import create_app
from errors import ApiError
from extensions import db
from services.ai_study_action_service import AiStudyActionService


class AiStudyActionServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(
            {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"}
        )
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.actions = AiStudyActionService(
            lambda topic, count: [
                {
                    "question": f"Question {index} about {topic}",
                    "answer": f"Answer {index}",
                    "status": "review",
                }
                for index in range(1, count + 1)
            ]
        )

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_compound_action_saves_folder_and_cards_together(self):
        result = self.actions.execute(
            "create_folder_with_flashcards",
            {"name": "Math", "topic": "algebra", "count": 3},
            "user-a",
            None,
        )

        self.assertEqual(result["action"], "folder_and_flashcards_created")
        self.assertEqual(result["count"], 3)
        folder_id = result["folder"]["id"]
        contents = self.actions.execute(
            "get_folder_contents", {"folder_id": folder_id}, "user-a", None
        )
        self.assertEqual(len(contents["flashcards"]), 3)

    def test_tools_reject_another_users_folder(self):
        folder = self.actions.execute(
            "create_folder", {"name": "Private"}, "user-a", None
        )["folder"]

        with self.assertRaises(ApiError) as error:
            self.actions.execute(
                "get_folder_contents", {"folder_id": folder["id"]}, "user-b", None
            )
        self.assertEqual(error.exception.status_code, 403)

    def test_current_folder_is_only_used_when_no_explicit_folder_is_given(self):
        first = self.actions.execute(
            "create_folder", {"name": "Physics"}, "user-a", None
        )["folder"]
        second = self.actions.execute(
            "create_folder", {"name": "Chemistry"}, "user-a", None
        )["folder"]

        result = self.actions.execute(
            "create_flashcards",
            {"folder_name": "Chemistry", "topic": "atoms", "count": 1},
            "user-a",
            first["id"],
        )
        self.assertEqual(result["folder"]["id"], second["id"])


if __name__ == "__main__":
    unittest.main()
