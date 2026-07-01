import os
import random
from dotenv import load_dotenv
from locust import HttpUser, task, between

load_dotenv()

KWIK_AUTH_TOKEN = os.getenv("KWIK_AUTH_TOKEN", "TOKEN_NOT_FOUND")

# 1. LOAD YOUR LONG URLS
try:
    with open("links.txt", "r") as f:
        # This will load all your Wikipedia links
        LONG_URLS = [line.strip() for line in f if line.strip()]
    print(f"✅ Loaded {len(LONG_URLS)} long URLs from links.txt")
except FileNotFoundError:
    print("❌ ERROR: links.txt not found!")
    LONG_URLS = ["https://wikipedia.org"]

# 2. SHARED MEMORY FOR SHORTCODES
# We will store the generated shortcodes here so the redirect task can actually hit them.
CREATED_SHORTCODES = []

class KwikLoadTest(HttpUser):
    wait_time = between(0.1, 0.3)
    
    def on_start(self):
        self.headers = {
            "Authorization": f"Bearer {KWIK_AUTH_TOKEN}",
            "Content-Type": "application/json"
        }

    @task(3)
    def create_link(self):
        """Pulls a long URL from your file and creates a shortlink."""
        if not LONG_URLS:
            return
            
        # Pick one of your real Wikipedia links
        long_url = random.choice(LONG_URLS)
        payload = {"longUrl": long_url}
        
        # We use catch_response=True so we can read the JSON returned by your FastAPI server
        with self.client.post("/v1/links", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if "shortCode" in data:
                    # Save the shortcode so the redirect task knows what to hit
                    CREATED_SHORTCODES.append(data["shortCode"])
                    response.success()
            else:
                response.failure(f"Failed to create: {response.text}")

    @task(7)
    def redirect_link(self):
        """Blasts the redirect endpoint using the shortcodes we just generated."""
        if CREATED_SHORTCODES:
            # Pick a shortcode that we know exists in the DB/Redis
            shortcode = random.choice(CREATED_SHORTCODES)
            self.client.get(f"/{shortcode}", name="Public Redirect")