"""Public redirect route for shortened URLs (no authentication required)"""

import hashlib
import uuid
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from models.Link import Link, LinkStatus
from models.ClickEvent import ClickEvent
from database.session import get_db
from services import geoLocation

router = APIRouter(tags=["public"])


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

    # Get geolocation data
    geoData = geoLocation.getGeoData(clientIp)
    
    # Create click event record
    eventId = str(uuid.uuid4())
    ipHash = hashlib.sha256(clientIp.encode()).hexdigest()
    userAgent = request.headers.get("user-agent")

    clickEvent = ClickEvent(
        eventId=eventId,
        shortCode=shortCode,
        userId=link.ownerId,  # Track which user owns the link
        ipHash=ipHash,
        userAgent=userAgent,
        country=geoData.get("country"),
        region=geoData.get("regionName"),
        city=geoData.get("city"),
        timezone=geoData.get("timezone"),
        isp=geoData.get("isp"),
    )

    db.add(clickEvent)
    db.commit()

    return RedirectResponse(url=link.longUrl)
