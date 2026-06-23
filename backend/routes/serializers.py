"""Serialization utilities for converting model objects to API responses"""

from models.ClickEvent import ClickEvent
from models.Link import Link


def serialize_link(link: Link, click_count: int = 0):
    """Convert Link model to API response format"""
    return {
        "shortCode": link.shortCode,
        "longUrl": link.longUrl,
        "createdAt": link.createdAt.isoformat() if link.createdAt else None,
        "expiresAt": link.expiresAt.isoformat() if link.expiresAt else None,
        "status": link.status.value if hasattr(link.status, "value") else link.status,
        "ownerId": link.ownerId,
        "clickCount": click_count,
    }


def serialize_click_event(event: ClickEvent):
    """Convert ClickEvent model to API response format"""
    return {
        "eventId": event.eventId,
        "shortCode": event.shortCode,
        "timestamp": event.timestamp.isoformat() if event.timestamp else None,
        "ipHash": event.ipHash,
        "userAgent": event.userAgent or "",
        "country": event.country,
        "region": event.region,
        "city": event.city,
        "timezone": event.timezone,
        "isp": event.isp,
    }



