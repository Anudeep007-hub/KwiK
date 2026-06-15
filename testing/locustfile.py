from locust import HttpUser, task, between
import random
import threading


class URLShortenerUser(HttpUser):

    wait_time = between(1, 3)

    urls = []
    short_codes = []

    lock = threading.Lock()

    def on_start(self):

        if not URLShortenerUser.urls:

            with open("urls.txt") as f:

                URLShortenerUser.urls = (
                    f.read()
                    .splitlines()
                )

    @task(20)
    def create_short_url(self):

        long_url = random.choice(
            URLShortenerUser.urls
        )

        response = self.client.post(
            "/v1/links",
            json={
                "longUrl": long_url
            },
            name="POST /v1/links"
        )

        if response.status_code == 200:

            try:

                short_code = (
                    response.json()
                    .get("shortCode")
                )

                if short_code:

                    with URLShortenerUser.lock:

                        URLShortenerUser.short_codes.append(
                            short_code
                        )

            except Exception:
                pass

    @task(80)
    def redirect_url(self):

        if not URLShortenerUser.short_codes:
            return

        short_code = random.choice(
            URLShortenerUser.short_codes
        )

        self.client.get(
            f"/{short_code}",
            allow_redirects=False,
            name="GET /{shortCode}"
        )