"""Smoke tests for the application factory and request validation."""

import unittest
from datetime import timedelta

from app import create_app
from extensions import db


class ApplicationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            from flask_jwt_extended import create_access_token
            self.token = create_access_token(identity="test-user-id")
            self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["message"], "Spacia Backend Running")

    def test_folder_requires_json(self):
        response = self.client.post("/folders", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("JSON object", response.get_json()["message"])

    def test_folder_can_be_created_and_listed(self):
        create_response = self.client.post(
            "/folders",
            json={"subject": "Physics", "accentColor": "#3366FF"},
            headers=self.headers,
        )
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get("/folders", headers=self.headers)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.get_json()["response"][0]["subject"], "Physics")

    def test_folder_can_be_created_with_custom_id(self):
        custom_id = "test-folder-uuid-12345"
        create_response = self.client.post(
            "/folders",
            json={"id": custom_id, "subject": "Chemistry", "accentColor": "#FF3366"},
            headers=self.headers,
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.get_json()["folder"], custom_id)

        list_response = self.client.get("/folders", headers=self.headers)
        self.assertEqual(list_response.status_code, 200)
        folders = list_response.get_json()["response"]
        found = [f for f in folders if f["id"] == custom_id]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["subject"], "Chemistry")

    def test_flashcard_can_be_created_with_custom_id(self):
        folder_response = self.client.post(
            "/folders",
            json={"subject": "Biology", "accentColor": "#33FF66"},
            headers=self.headers,
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
            headers=self.headers,
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.get_json()["data"]["id"], custom_card_id)

        list_response = self.client.get(f"/flashcards/{folder_id}/saved", headers=self.headers)
        self.assertEqual(list_response.status_code, 200)
        cards = list_response.get_json()
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["id"], custom_card_id)
        self.assertEqual(cards[0]["question"], "What is DNA?")

    def test_flashcards_are_isolated_by_jwt_subject(self):
        owner_folder = self.client.post(
            "/folders",
            json={"subject": "Private", "accentColor": "#123456"},
            headers=self.headers,
        ).get_json()["folder"]
        from flask_jwt_extended import create_access_token
        with self.app.app_context():
            other_token = create_access_token(identity="other-user-id")
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = self.client.get(f"/flashcards/{owner_folder}/saved", headers=other_headers)
        self.assertEqual(response.status_code, 403)

    def test_flashcard_endpoints_require_a_jwt(self):
        response = self.client.get("/flashcards/not-a-folder/saved")
        self.assertEqual(response.status_code, 401)

    def test_user_registration_and_login(self):
        register_response = self.client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "password123",
            },
        )
        self.assertEqual(register_response.status_code, 201)
        reg_json = register_response.get_json()
        self.assertIn("access_token", reg_json)
        self.assertIn("refresh_token", reg_json)
        self.assertEqual(reg_json["user"]["username"], "testuser")

        login_response = self.client.post(
            "/auth/login",
            json={
                "identifier": "testuser",
                "password": "password123",
            },
        )
        self.assertEqual(login_response.status_code, 200)
        login_json = login_response.get_json()
        self.assertIn("access_token", login_json)
        self.assertIn("refresh_token", login_json)
        self.assertEqual(login_json["user"]["username"], "testuser")

    def test_refresh_returns_a_new_access_token(self):
        register_response = self.client.post(
            "/auth/register",
            json={"username": "refreshuser", "email": "refresh@example.com", "password": "password123"},
        )
        refresh_token = register_response.get_json()["refresh_token"]
        response = self.client.post("/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.get_json())

    def test_expired_access_token_returns_machine_readable_error(self):
        from flask_jwt_extended import create_access_token
        with self.app.app_context():
            expired_token = create_access_token(identity="expired-user", expires_delta=timedelta(seconds=-1))
        response = self.client.get("/folders", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["code"], "token_expired")

    def test_login_invalid_credentials(self):
        self.client.post(
            "/auth/register",
            json={
                "username": "testuser2",
                "email": "test2@example.com",
                "password": "password123",
            },
        )
        login_response = self.client.post(
            "/auth/login",
            json={
                "identifier": "testuser2",
                "password": "wrongpassword",
            },
        )
        self.assertEqual(login_response.status_code, 401)
        login_json = login_response.get_json()
        self.assertEqual(login_json["success"], False)
        self.assertEqual(login_json["code"], "invalid_credentials")


if __name__ == "__main__":
    unittest.main()
