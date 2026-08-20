"""End-to-end API tests for the authenticated study-session flow."""

import unittest
from datetime import datetime, timedelta, timezone

from flask_jwt_extended import create_access_token

from app import create_app
from extensions import db
from models.studysessions import StudySession


class StudySessionApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(
            {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"}
        )
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            token = create_access_token(identity="study-user")
        self.headers = {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_start_reuses_active_session_then_end_persists_duration(self):
        started_at = datetime(2026, 8, 17, 10, 0, tzinfo=timezone.utc)
        start_response = self.client.post(
            "/study-sessions/start",
            json={"startTime": started_at.isoformat().replace("+00:00", "Z")},
            headers=self.headers,
        )
        self.assertEqual(start_response.status_code, 201)
        session_id = start_response.get_json()["session_id"]

        repeated_start = self.client.post(
            "/study-sessions/start",
            json={"startTime": (started_at + timedelta(seconds=30)).isoformat()},
            headers=self.headers,
        )
        self.assertEqual(repeated_start.status_code, 200)
        self.assertEqual(repeated_start.get_json()["session_id"], session_id)

        ended_at = started_at + timedelta(seconds=90)
        end_response = self.client.post(
            "/study-sessions/end",
            json={"endTime": ended_at.isoformat(), "sessionId": session_id},
            headers=self.headers,
        )
        self.assertEqual(end_response.status_code, 200)
        self.assertEqual(end_response.get_json()["duration_seconds"], 90)

        with self.app.app_context():
            session = db.session.get(StudySession, session_id)
            self.assertIsNotNone(session.ended_at)
            self.assertEqual(session.duration_seconds, 90)
            self.assertEqual(
                StudySession.query.filter_by(
                    user_id="study-user", ended_at=None
                ).count(),
                0,
            )

        dashboard = self.client.get("/streak/dashboard", headers=self.headers)
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.get_json()["statistics"]["study_time_minutes"], 1)

    def test_end_clamps_a_clock_skewed_negative_duration_to_zero(self):
        started_at = datetime(2026, 8, 17, 10, 0, tzinfo=timezone.utc)
        session_id = self.client.post(
            "/study-sessions/start",
            json={"startTime": started_at.isoformat()},
            headers=self.headers,
        ).get_json()["session_id"]
        response = self.client.post(
            "/study-sessions/end",
            json={
                "endTime": (started_at - timedelta(seconds=10)).isoformat(),
                "sessionId": session_id,
            },
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["duration_seconds"], 0)

    def test_study_session_endpoints_require_an_access_token(self):
        response = self.client.post(
            "/study-sessions/start", json={"startTime": "2026-08-17T10:00:00Z"}
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["code"], "token_missing")

    def test_expired_access_token_has_the_refreshable_error_code(self):
        with self.app.app_context():
            expired_token = create_access_token(
                identity="study-user", expires_delta=timedelta(seconds=-1)
            )
        response = self.client.post(
            "/study-sessions/start",
            json={"startTime": "2026-08-17T10:00:00Z"},
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["code"], "token_expired")


if __name__ == "__main__":
    unittest.main()
