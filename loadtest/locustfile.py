from locust import HttpUser, task, between
import random
import string


class SpaciaUser(HttpUser):

    wait_time = between(1, 3)

    def on_start(self):
        """Login when a virtual user starts."""

        response = self.client.post(
            "/auth/login",
            json={
                "identifier": "nigga",
                "password": "uzumaki@15"
            },
            name="POST /auth/login"
        )

        if response.status_code != 200:
            print("Login failed:")
            print(response.text)
            response.failure("Login failed")
            return

        data = response.json()

        self.token = data["access_token"]

    @task
    def create_folder(self):
        """Create a new folder."""

        random_id = ''.join(
            random.choices(string.ascii_letters + string.digits, k=8)
        )

        response = self.client.post(
            "/folders",
            json={
                "subject": f"Locust Test {random_id}",
                "accentColor": "#3498DB"
            },
            headers={
                "Authorization": f"Bearer {self.token}"
            },
            name="POST /folders"
        )

        if response.status_code != 201:
            response.failure(
                f"Folder creation failed: {response.status_code}"
            )