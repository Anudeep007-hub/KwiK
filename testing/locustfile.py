from locust import task, between
from locust.contrib.fasthttp import FastHttpUser

class HighPerformanceUser(FastHttpUser):
    # Simulate realistic user delay
    wait_time = between(1, 3)
    
    # FastHttpUser uses geventhttpclient, which is 5-10x faster
    connection_timeout = 10.0
    network_timeout = 30.0

    @task
    def test_shortener(self):
        # Your target URL endpoint
        longUrl = f"https://github.com/Anudeep007-hub/KwiK"
        self.client.get(f"/v1/links?longUrl={longUrl}")