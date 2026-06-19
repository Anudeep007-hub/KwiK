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


def serialize_github_issue(issue):
    """Convert GitHub issue to API response format"""
    labels = issue.get("labels", [])
    repository_url = issue.get("repository_url", "")
    repository = repository_url.rsplit("/", 1)[-1] if repository_url else ""
    state = issue.get("state")

    priority = get_github_label_value(
        labels,
        {
            "critical": "CRITICAL",
            "priority: critical": "CRITICAL",
            "high": "HIGH",
            "priority: high": "HIGH",
            "medium": "MEDIUM",
            "priority: medium": "MEDIUM",
            "low": "LOW",
            "priority: low": "LOW",
        },
        "MEDIUM",
    )
    issue_type = get_github_label_value(
        labels,
        {"bug": "BUG", "type: bug": "BUG", "feature": "FEATURE", "enhancement": "FEATURE"},
        "FEATURE",
    )
    status = get_github_label_value(
        labels,
        {"in progress": "IN_PROGRESS", "status: in progress": "IN_PROGRESS"},
        "OPEN" if state == "open" else "CLOSED",
    )

    return {
        "id": str(issue.get("id")),
        "number": issue.get("number"),
        "title": issue.get("title"),
        "description": issue.get("body") or "",
        "status": status,
        "priority": priority,
        "type": issue_type,
        "createdAt": issue.get("created_at"),
        "author": issue.get("user", {}).get("login", "unknown"),
        "repository": repository,
        "url": issue.get("html_url"),
        "linkedPR": None,
    }


def get_github_label_value(labels, names, fallback):
    """Extract GitHub label value from list of labels"""
    for label in labels:
        label_name = label.get("name", "").lower()
        if label_name in names:
            return names[label_name]
    return fallback
