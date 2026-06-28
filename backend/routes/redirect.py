"""Public redirect route for shortened URLs (no authentication required)"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import json

from database.session import get_db
from models.ClickEvent import ClickEvent
from models.Link import Link, LinkStatus

from services.clickTracker import extract_click_data
from services.clickPublisher import publish_geo_event
from services.redisClient import get_redis

router = APIRouter(tags=["public"])


@router.get("/{shortCode}")
async def redirect_short_url(
    shortCode: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Redirect short URL and enqueue geo enrichment."""

    redis = get_redis()

    cached = await redis.get(f"links:{shortCode}")

    if cached:
        link = json.loads(cached)

    else:
        dbLink = (
            db.query(Link)
            .filter(Link.shortCode == shortCode)
            .first()
        )

        if not dbLink:
            return {"message": "Link not found"}

        link = {
            "longUrl": dbLink.longUrl,
            "ownerId": dbLink.ownerId,
            "status": dbLink.status.value,
        }
        try:
            await redis.set(
                f"links:{shortCode}",
                json.dumps(link),
                ex=86400,
            )
        except Exception:
            raise f"Redis Error"

    if not link:
        return {"message": "Link not found"}

    if link["status"] != LinkStatus.ACTIVE.value:
        return {"message": "Link disabled"}

    clickData = extract_click_data(request)

    clickEvent = ClickEvent(
        eventId=clickData["eventId"],
        shortCode=shortCode,
        userId=link["ownerId"],
        ipHash=clickData["ipHash"],
        userAgent=clickData["browser"],
        timestamp=clickData["timestamp"],
        geoStatus="PENDING",
    )

    db.add(clickEvent)
    db.commit()

    await publish_geo_event(
        event_id=clickData["eventId"],
        client_ip=clickData["clientIp"],
    )

    return RedirectResponse(
        url=link["longUrl"],
        status_code=307,
    )