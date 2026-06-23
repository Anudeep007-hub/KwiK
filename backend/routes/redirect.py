"""Public redirect route for shortened URLs (no authentication required)"""

import hashlib
import uuid
import logging
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from models.Link import Link, LinkStatus
from models.ClickEvent import ClickEvent
from database.session import get_db
from services import geoLocation

router = APIRouter(tags=["public"])
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



@router.get("/{shortCode}")
async def redirect_short_url(
    shortCode: str, request: Request, db: Session = Depends(get_db)
):
    """Redirect short URL to long URL and track click event (public endpoint)"""
    link = db.query(Link).filter(Link.shortCode == shortCode).first()

    if not link:
        return {"message": "Link not found"}
    
    if link.status != LinkStatus.ACTIVE:
        return {"message": "Link disabled"}

    # Extract client IP
    clientIp = request.headers.get("x-forwarded-for", request.client.host).split(" ")[0].strip(",")

    try:
        geoData = geoLocation.getGeoData(clientIp)
    except Exception as exc:
        logger.warning("Geo lookup failed for click on %s: %s", shortCode, exc)
        geoData = {}
    
    # Create click event record. uuid4().hex is 32 chars, matching eventId.
    eventId = uuid.uuid4().hex
    ipHash = hashlib.sha256(clientIp.encode()).hexdigest()
    headers = request.headers

    browser_info = headers.get("sec-ch-ua", "")

    browser = "Unknown"

    for key, value in BROWSERS.items():
        if key in browser_info:
            browser = value
            break


    try:
        clickEvent = ClickEvent(    
            eventId=eventId,
            shortCode=shortCode,
            userId=link.ownerId,
            ipHash=ipHash,
            userAgent=browser,
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

    return RedirectResponse(url=link.longUrl)
