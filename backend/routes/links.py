"""Link management routes (CRUD operations for shortened URLs)"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Dict, Any
import json

from models.Link import Link, LinkStatus
from models.ClickEvent import ClickEvent
from models.requests.linkRequest import LinkRequest
from database.session import get_db
from services.dependencies import get_current_user
from services import base62Converter, uniqueIDGenerator
from routes.serializers import serialize_link 
from services.redisClient import get_redis

router = APIRouter(prefix="/v1/links", tags=["links"])


@router.post("")
async def create_short_link(
    req: LinkRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new shortened URL (requires authentication)"""
    uniqueID = uniqueIDGenerator.getUniqueID()
    shortCode = base62Converter.getBase62(uniqueID)

    user_id = current_user.get("sub")

    link = Link(
        shortCode=shortCode,
        longUrl=req.longUrl,
        status=LinkStatus.ACTIVE,
        ownerId=user_id,
    )
    db.add(link)
    db.commit() 
    redis = get_redis() 
    await redis.set(
        f"links:{shortCode}",
        json.dumps(
            {
                "longUrl":req.longUrl,
                "ownerId":user_id,
                "status":LinkStatus.ACTIVE.value
            }
        ), 
        ex=70000,
    )
    db.refresh(link)

    return {"shortCode": shortCode}


@router.get("")
async def list_user_links(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all links for the current authenticated user"""
    user_id = current_user.get("sub")

    click_counts = (
        db.query(
            ClickEvent.shortCode,
            func.count(ClickEvent.eventId).label("clickCount"),
        )
        .group_by(ClickEvent.shortCode)
        .subquery()
    )

    rows = (
        db.query(Link, func.coalesce(click_counts.c.clickCount, 0))
        .filter(Link.ownerId == user_id)
        .outerjoin(click_counts, Link.shortCode == click_counts.c.shortCode)
        .order_by(Link.createdAt.desc())
        .all()
    )

    return [serialize_link(link, click_count) for link, click_count in rows]


@router.get("/{shortCode}")
async def get_link_by_short_code(
    shortCode: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific link by short code (must be owner)"""
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

    return serialize_link(link, click_count or 0)


class LinkStatusUpdateRequest(BaseModel):
    status: str


@router.patch("/{shortCode}/status")
async def update_link_status(
    shortCode: str,
    payload: LinkStatusUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update link status (must be owner)"""
    if payload.status not in LinkStatus.__members__:
        raise HTTPException(status_code=400, detail="Invalid status value")

    user_id = current_user.get("sub")

    link = db.query(Link).filter(
        Link.shortCode == shortCode, Link.ownerId == user_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found or unauthorized")

    link.status = LinkStatus(payload.status)
    db.commit() 
    redis = get_redis() 
    await redis.set( 
        f"links:{shortCode}",  
        json.dumps( 
            {
                "longUrl": link.longUrl,
                "ownerId":link.ownerId,
                "status":link.status.value,
            }
            ) ,
        ex=86400,         
        )
    db.refresh(link)

    click_count = (
        db.query(func.count(ClickEvent.eventId))
        .filter(ClickEvent.shortCode == shortCode)
        .scalar()
    )
    data = serialize_link(link, click_count or 0)

    for k, v in data.items():
        print(k, type(v), v)

    return data
