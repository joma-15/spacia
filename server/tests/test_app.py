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


if __name__ == "__main__":
    unittest.main()
