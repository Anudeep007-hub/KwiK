"""Public redirect route for shortened URLs (no authentication required)"""

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from models.Link import Link, LinkStatus
from database.session import get_db
from services.clickTracker import extract_click_data
from services.clickPublisher import publish_click_event

router = APIRouter(tags=["public"])


@router.get("/{shortCode}")
async def redirect_short_url(
    shortCode: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Redirect short URL to long URL and track click event."""

    link = db.query(Link).filter(Link.shortCode == shortCode).first()

    if not link:
        return {"message": "Link not found"}

    if link.status != LinkStatus.ACTIVE:
        return {"message": "Link disabled"}

    clickData = extract_click_data(request)

    background_tasks.add_task(
        publish_click_event,
        owner_id=link.ownerId,
        shortCode=shortCode,
        clickData=clickData,
    )

    return RedirectResponse(url=link.longUrl)
