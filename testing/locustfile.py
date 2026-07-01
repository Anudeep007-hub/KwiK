import os
import random
from locust import HttpUser, task, between

# Load links from file once at startup
with open("links.txt", "r") as f:
    # Assuming the file contains shortcodes, one per line
    PRELOADED_SHORTCODES = [line.strip() for line in f if line.strip()]

class KwikLoadTest(HttpUser):
    # Short wait time for high throughput
    wait_time = between(0.1, 0.5)
    
    def on_start(self):
        # Bypass authentication using a header your backend recognizes as 'authorized'
        self.headers = {
            "Authorization": f"Bearer {os.getenv('KWIK_AUTH_TOKEN')}",
            "Content-Type": "application/json"
        }

    @task(7)
    def redirect_link(self):
        """Focus on high-speed redirection."""
        short_code = random.choice(PRELOADED_SHORTCODES)
        self.client.get(f"/v1/{short_code}", name="/v1/[shortcode]")

    @task(3)
    def create_link(self):
        """Focus on link creation."""
        payload = {"longUrl": f"https://example.com/target-{random.randint(1, 100000)}"}
        self.client.post("/v1/links", json=payload, headers=self.headers)