"""Smoke tests for the application factory and request validation."""

import unittest
from datetime import timedelta

from app import create_app
from extensions import db


class ApplicationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(
            {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"}
        )
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
        folder = list_response.get_json()["response"][0]
        self.assertEqual(folder["subject"], "Physics")
        self.assertEqual(folder["cardCount"], 0)
        self.assertEqual(folder["reviewCardCount"], 0)
        self.assertEqual(folder["understoodCardCount"], 0)

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

    def test_folder_can_be_updated_and_deleted_by_its_owner(self):
        folder_id = self.client.post(
            "/folders",
            json={"subject": "Chemistry", "accentColor": "#FF3366"},
            headers=self.headers,
        ).get_json()["folder"]

        update_response = self.client.patch(
            f"/folders/{folder_id}",
            json={"subject": "Organic Chemistry", "accentColor": "#112233"},
            headers=self.headers,
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(
            update_response.get_json()["folder"]["subject"], "Organic Chemistry"
        )

        delete_response = self.client.delete(
            f"/folders/{folder_id}", headers=self.headers
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(
            self.client.get("/folders", headers=self.headers).get_json()["response"], []
        )

    def test_deleting_a_missing_folder_returns_404(self):
        response = self.client.delete(
            "/folders/missing-folder-id", headers=self.headers
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["message"], "Folder not found.")

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

        list_response = self.client.get(
            f"/flashcards/{folder_id}/saved", headers=self.headers
        )
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

        response = self.client.get(
            f"/flashcards/{owner_folder}/saved", headers=other_headers
        )
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
            json={
                "username": "refreshuser",
                "email": "refresh@example.com",
                "password": "password123",
            },
        )
        refresh_token = register_response.get_json()["refresh_token"]
        response = self.client.post(
            "/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.get_json())

    def test_expired_access_token_returns_machine_readable_error(self):
        from flask_jwt_extended import create_access_token

        with self.app.app_context():
            expired_token = create_access_token(
                identity="expired-user", expires_delta=timedelta(seconds=-1)
            )
        response = self.client.get(
            "/folders", headers={"Authorization": f"Bearer {expired_token}"}
        )
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


# ---------------------------------------------------------------------------
# Batch status endpoint tests (PATCH /flashcards/batch-status)
# ---------------------------------------------------------------------------

class FlashcardBatchStatusTestCase(unittest.TestCase):
    """
    Tests for PATCH /flashcards/batch-status — the endpoint games use to
    sync an entire session's understood cards in one request.

    Each test creates its own folder + cards so tests are fully isolated.
    """

    def setUp(self):
        self.app = create_app(
            {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"}
        )
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            from flask_jwt_extended import create_access_token

            self.token = create_access_token(identity="test-user-id")
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            }

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # ------------------------------------------------------------------ helpers

    def _create_folder(self):
        """Creates a folder and returns its ID."""
        resp = self.client.post(
            "/folders",
            json={"subject": "Test", "accentColor": "#112233"},
            headers=self.headers,
        )
        return resp.get_json()["folder"]

    def _create_card(self, folder_id, status="review", card_id=None):
        """Creates a flashcard and returns its ID."""
        payload = {
            "question": "Q?",
            "answer": "A",
            "status": status,
        }
        if card_id:
            payload["id"] = card_id
        resp = self.client.post(
            f"/flashcards/{folder_id}/manualSaved",
            json=payload,
            headers=self.headers,
        )
        return resp.get_json()["data"]["id"]

    # ------------------------------------------------------------------ tests

    def test_batch_empty_updates_list_returns_400(self):
        """Test 1 (req #19): An empty updates list must be rejected."""
        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": []},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 400)

    def test_batch_missing_id_field_returns_400(self):
        """Test 2 (req #19): Each update must include both id and status."""
        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"status": "understood"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 400)

    def test_batch_invalid_status_returns_400(self):
        """Test 3 (req #14): Invalid status values must be rejected."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id)
        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": card_id, "status": "invalid_status"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 400)

    def test_batch_single_card_success(self):
        """Test 4 (req #18): A valid single-card batch is accepted and applied."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id)

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": card_id, "status": "understood"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], card_id)
        self.assertEqual(data[0]["status"], "understood")

    def test_batch_multiple_cards_success(self):
        """Test 5 (req #18): A valid multi-card batch updates all cards in one request."""
        folder_id = self._create_folder()
        card_a = self._create_card(folder_id)
        card_b = self._create_card(folder_id)
        card_c = self._create_card(folder_id)

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={
                "updates": [
                    {"id": card_a, "status": "understood"},
                    {"id": card_b, "status": "understood"},
                    {"id": card_c, "status": "understood"},
                ]
            },
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 200)
        returned_ids = {d["id"] for d in resp.get_json()["data"]}
        self.assertEqual(returned_ids, {card_a, card_b, card_c})

    def test_batch_duplicate_ids_last_write_wins(self):
        """Test 6 (req #8): Duplicate IDs in the batch are handled safely."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id)

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={
                "updates": [
                    {"id": card_id, "status": "review"},
                    {"id": card_id, "status": "understood"},
                ]
            },
            headers=self.headers,
        )
        # The batch should succeed (both writes are valid)
        self.assertEqual(resp.status_code, 200)
        # The card should end up in the last-written status
        data = resp.get_json()["data"]
        final_status = next(d["status"] for d in data if d["id"] == card_id)
        self.assertEqual(final_status, "understood")

    def test_batch_unknown_card_returns_404(self):
        """Test 7 (req #14): An unknown card ID causes the whole batch to fail."""
        folder_id = self._create_folder()
        real_card = self._create_card(folder_id)

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={
                "updates": [
                    {"id": real_card, "status": "understood"},
                    {"id": "non-existent-card-id", "status": "understood"},
                ]
            },
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 404)

        # Verify the real card was NOT updated (all-or-nothing semantics)
        saved = self.client.get(
            f"/flashcards/{folder_id}/saved", headers=self.headers
        ).get_json()
        real_status = next(c["status"] for c in saved if c["id"] == real_card)
        self.assertEqual(real_status, "review")

    def test_batch_card_owned_by_other_user_returns_403(self):
        """Test 8 (req #14): A card owned by another user rejects the whole batch."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id)

        with self.app.app_context():
            from flask_jwt_extended import create_access_token
            other_token = create_access_token(identity="other-user-id")
        other_headers = {
            "Authorization": f"Bearer {other_token}",
            "Content-Type": "application/json",
        }

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": card_id, "status": "understood"}]},
            headers=other_headers,
        )
        self.assertEqual(resp.status_code, 403)

    def test_batch_already_understood_card_is_idempotent(self):
        """Test 9 (req #14): Updating an already-understood card to understood is idempotent."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id, status="understood")

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": card_id, "status": "understood"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()["data"]
        self.assertEqual(data[0]["status"], "understood")

    def test_batch_understood_to_review_transition(self):
        """Test 10 (req #14): The batch endpoint allows understood → review transitions."""
        folder_id = self._create_folder()
        card_id = self._create_card(folder_id, status="understood")

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": card_id, "status": "review"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["data"][0]["status"], "review")

    def test_batch_mixed_valid_and_invalid_commits_nothing(self):
        """Test 11 (req #14): A batch with any invalid entry commits nothing."""
        folder_id = self._create_folder()
        good_card = self._create_card(folder_id)

        resp = self.client.patch(
            "/flashcards/batch-status",
            json={
                "updates": [
                    {"id": good_card, "status": "understood"},
                    {"id": "totally-missing-card", "status": "understood"},
                ]
            },
            headers=self.headers,
        )
        self.assertIn(resp.status_code, (400, 404))

        # Verify the good card was not updated
        saved = self.client.get(
            f"/flashcards/{folder_id}/saved", headers=self.headers
        ).get_json()
        good_status = next(c["status"] for c in saved if c["id"] == good_card)
        self.assertEqual(good_status, "review")

    def test_batch_missing_updates_key_returns_400(self):
        """Test 12 (req #19): Requests without the top-level `updates` key are rejected."""
        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"data": [{"id": "x", "status": "understood"}]},
            headers=self.headers,
        )
        self.assertEqual(resp.status_code, 400)

    def test_batch_unauthenticated_returns_401(self):
        """Test 13 (req #14): Unauthenticated requests are rejected."""
        resp = self.client.patch(
            "/flashcards/batch-status",
            json={"updates": [{"id": "x", "status": "understood"}]},
        )
        self.assertEqual(resp.status_code, 401)


if __name__ == "__main__":
    unittest.main()
