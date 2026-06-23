from fastapi import FastAPI, Request
from user_agents import parse

app = FastAPI()

BROWSERS = {
    "Brave": "Brave",
    "Google Chrome": "Chrome",
    "Microsoft Edge": "Edge",
    "Opera": "Opera",
    "Mozilla Firefox": "Firefox",
    "Safari": "Safari",
    "Samsung Internet": "Samsung Internet",
    "Vivaldi": "Vivaldi",
    "DuckDuckGo": "DuckDuckGo",
    "Arc": "Arc",
    "Yandex Browser": "Yandex",
    "UC Browser": "UC Browser",
    "QQ Browser": "QQ Browser",
    "Internet Explorer": "Internet Explorer",
}


@app.get("/")
def home(req: Request):
    headers = req.headers

    browser_info = headers.get("sec-ch-ua", "")

    browser = "Unknown"

    for key, value in BROWSERS.items():
        if key in browser_info:
            browser = value
            break

    print(f"sec-ch-ua: {browser_info}")
    print(f"Browser: {browser}")

    return {
        "browser": browser,
        "raw": browser_info
    }