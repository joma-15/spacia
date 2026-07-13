"""Smoke tests for the application factory and request validation."""

import unittest

from app import create_app
from extensions import db


class ApplicationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["message"], "Spacia Backend Running")

    def test_folder_requires_json(self):
        response = self.client.post("/folders")
        self.assertEqual(response.status_code, 400)
        self.assertIn("JSON object", response.get_json()["error"])

    def test_folder_can_be_created_and_listed(self):
        create_response = self.client.post(
            "/folders",
            json={"subject": "Physics", "accentColor": "#3366FF"},
        )
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get("/folders")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.get_json()["response"][0]["subject"], "Physics")

    def test_folder_can_be_created_with_custom_id(self):
        custom_id = "test-folder-uuid-12345"
        create_response = self.client.post(
            "/folders",
            json={"id": custom_id, "subject": "Chemistry", "accentColor": "#FF3366"},
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.get_json()["folder"], custom_id)

        list_response = self.client.get("/folders")
        self.assertEqual(list_response.status_code, 200)
        folders = list_response.get_json()["response"]
        found = [f for f in folders if f["id"] == custom_id]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["subject"], "Chemistry")

    def test_flashcard_can_be_created_with_custom_id(self):
        folder_response = self.client.post(
            "/folders",
            json={"subject": "Biology", "accentColor": "#33FF66"},
        )
        folder_id = folder_response.get_json()["folder"]

        custom_card_id = "test-card-uuid-54321"
        create_response = self.client.post(
            f"/flashcards/{folder_id}/manualSaved",
            json={
                "id": custom_card_id,
                "question": "What is DNA?",
                "answer": "Deoxyribonucleic acid",
                "status": "review",
            },
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.get_json()["data"]["id"], custom_card_id)

        list_response = self.client.get(f"/flashcards/{folder_id}/saved")
        self.assertEqual(list_response.status_code, 200)
        cards = list_response.get_json()
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["id"], custom_card_id)
        self.assertEqual(cards[0]["question"], "What is DNA?")


if __name__ == "__main__":
    unittest.main()
