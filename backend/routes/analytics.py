"""Analytics and click event tracking routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from models.Link import Link
from models.ClickEvent import ClickEvent
from database.session import get_db
from services.dependencies import get_current_user
from routes.serializers import serialize_click_event

router = APIRouter(prefix="/v1", tags=["analytics"])


@router.get("/click-events")
async def get_user_click_events(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get click events for current user's links only"""
    user_id = current_user.get("sub")

    # Get all links owned by current user
    user_link_codes = db.query(Link.shortCode).filter(Link.ownerId == user_id).all()
    user_link_codes = [code[0] for code in user_link_codes]

    if not user_link_codes:
        return []

    events = (
        db.query(ClickEvent)
        .filter(ClickEvent.shortCode.in_(user_link_codes))
        .order_by(ClickEvent.timestamp.desc())
        .all()
    )
    return [serialize_click_event(event) for event in events]


@router.get("/links/{shortCode}/click-summary")
async def get_link_click_summary(
    shortCode: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Small verification endpoint for checking click tracking."""
    user_id = current_user.get("sub")
    link = db.query(Link).filter(
        Link.shortCode == shortCode, Link.ownerId == user_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found or unauthorized")

    click_count = (
        db.query(func.count(ClickEvent.eventId))
        .filter(ClickEvent.shortCode == shortCode)
        .scalar()
    )
    last_click = (
        db.query(ClickEvent)
        .filter(ClickEvent.shortCode == shortCode)
        .order_by(ClickEvent.timestamp.desc())
        .first()
    )

    return {
        "shortCode": shortCode,
        "ownerId": link.ownerId,
        "clickCount": click_count or 0,
        "lastClick": serialize_click_event(last_click) if last_click else None,
    }


@router.get("/links/{shortCode}/events")
async def get_link_click_events(
    shortCode: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get click events for a specific link (must be owner)"""
    user_id = current_user.get("sub")

    # Verify link ownership
    link = db.query(Link).filter(
        Link.shortCode == shortCode, Link.ownerId == user_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found or unauthorized")

    events = (
        db.query(ClickEvent)
        .filter(ClickEvent.shortCode == shortCode)
        .order_by(ClickEvent.timestamp.desc())
        .all()
    )

    return [serialize_click_event(event) for event in events]
