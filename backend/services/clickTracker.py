import hashlib
import logging
import uuid
from datetime import datetime, timezone

from models.ClickEvent import ClickEvent
from services import geoLocation

logger = logging.getLogger(__name__)

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


def extract_click_data(request):
    """Extract all request related information."""

    clientIp = (
        request.headers.get("x-forwarded-for", request.client.host)
        .split(",")[0]
        .strip()
    )

    ipHash = hashlib.sha256(clientIp.encode()).hexdigest()

    browser_info = request.headers.get("sec-ch-ua", "")

    browser = "Unknown"

    for key, value in BROWSERS.items():
        if key in browser_info:
            browser = value
            break

    return {
        "clientIp": clientIp,
        "ipHash": ipHash,
        "browser": browser,
        "eventId": uuid.uuid4().hex,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def track_click(db, link, clickData, shortCode):
    """Current synchronous click tracking."""

    try:
        geoData = geoLocation.getGeoData(clickData["clientIp"])
    except Exception as exc:
        logger.warning("Geo lookup failed for click on %s: %s", shortCode, exc)
        geoData = {}

    try:
        clickEvent = ClickEvent(
            eventId=clickData["eventId"],
            shortCode=shortCode,
            userId=link.ownerId,
            ipHash=clickData["ipHash"],
            userAgent=clickData["browser"],
            country=geoData.get("country"),
            region=geoData.get("regionName"),
            city=geoData.get("city"),
            timezone=geoData.get("timezone"),
            isp=geoData.get("isp"),
        )

        db.add(clickEvent)
        db.commit()

    except Exception as exc:
        db.rollback()
        logger.exception("Click tracking failed for %s: %s", shortCode, exc)
