from locust import HttpUser, task, between
import random
import string


class SpaciaUser(HttpUser):

    wait_time = between(1, 3)

    def on_start(self):
        """Login when a virtual user starts."""

        with self.client.post(
            "/auth/login",
            json={
                "identifier": "nigga",
                "password": "uzumaki@15"
            },
            name="POST /auth/login",
            catch_response=True
        ) as response:

            if response.status_code != 200:
                print("Login failed:")
                print(response.text)
                response.failure(f"Login failed: {response.status_code}")
                self.token = None
                return

            try:
                data = response.json()
                self.token = data["access_token"]
            except Exception as e:
                print("Invalid login response:")
                print(response.text)
                response.failure(f"Invalid login response: {e}")
                self.token = None

    @task
    def create_folder(self):

        if not self.token:
            return

        random_id = ''.join(
            random.choices(
                string.ascii_letters + string.digits,
                k=8
            )
        )

        with self.client.post(
            "/folders",
            json={
                "subject": f"Locust Test {random_id}",
                "accentColor": "#3498DB"
            },
            headers={
                "Authorization": f"Bearer {self.token}"
            },
            name="POST /folders",
            catch_response=True
        ) as response:

            if response.status_code != 201:
                response.failure(
                    f"Folder creation failed: {response.status_code}"
                )