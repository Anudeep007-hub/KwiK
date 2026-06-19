from fastapi import APIRouter, Depends, Request
from fastapi import HTTPException
from fastapi.responses import RedirectResponse
import httpx
import os
from sqlalchemy import func
from sqlalchemy.orm import Session
import hashlib 
import uuid
# Local imports
from services import base62Converter, uniqueIDGenerator, geoLocation
  

from models.requests.linkRequest import LinkRequest 
from models.Link import Link
from models.ClickEvent import ClickEvent 
from models.Link import LinkStatus
from database.session import get_db




router = APIRouter()


def serialize_link(link: Link, click_count: int = 0):
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


def get_github_label_value(labels, names, fallback):
    for label in labels:
        label_name = label.get("name", "").lower()
        if label_name in names:
            return names[label_name]
    return fallback


def serialize_github_issue(issue):
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

@router.post("/v1/links") 
async def getTinyUrl(req: LinkRequest, db: Session = Depends(get_db)): 
    uniqueID = uniqueIDGenerator.getUniqueID() 
    shortCode = base62Converter.getBase62(uniqueID) 
    
    link = Link(shortCode=shortCode, 
                longUrl=req.longUrl,
                status=LinkStatus.ACTIVE) 
    db.add(link)
    db.commit() 
    db.refresh(link)
    
    return {"shortCode":shortCode} 

# Added for the FigmaFrontend dashboard. These are read-only routes and do not
# change the existing create route or short-code redirect behavior.
@router.get("/v1/links")
async def getLinks(db: Session = Depends(get_db)):
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
        .outerjoin(click_counts, Link.shortCode == click_counts.c.shortCode)
        .order_by(Link.createdAt.desc())
        .all()
    )

    return [serialize_link(link, click_count) for link, click_count in rows]


# Added for the FigmaFrontend detail page. Kept under /v1 so it does not
# conflict with the public /{shortCode} redirect route below.
@router.get("/v1/links/{shortCode}")
async def getLinkByShortCode(shortCode: str, db: Session = Depends(get_db)):
    link = db.query(Link).filter(Link.shortCode == shortCode).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    click_count = (
        db.query(func.count(ClickEvent.eventId))
        .filter(ClickEvent.shortCode == shortCode)
        .scalar()
    )

    return serialize_link(link, click_count or 0)


# Added for the FigmaFrontend analytics views. Existing click tracking still
# happens only inside the redirect route below.
@router.get("/v1/click-events")
async def getClickEvents(db: Session = Depends(get_db)):
    events = db.query(ClickEvent).order_by(ClickEvent.timestamp.desc()).all()
    return [serialize_click_event(event) for event in events]


# Added for the FigmaFrontend link detail page to show events for one short URL.
@router.get("/v1/links/{shortCode}/events")
async def getClickEventsByShortCode(shortCode: str, db: Session = Depends(get_db)):
    events = (
        db.query(ClickEvent)
        .filter(ClickEvent.shortCode == shortCode)
        .order_by(ClickEvent.timestamp.desc())
        .all()
    )

    return [serialize_click_event(event) for event in events]


# Added for the FigmaFrontend Issues page. This calls GitHub with the backend's
# GITHUB_TOKEN and returns only issues assigned to that authenticated user.
@router.get("/v1/github/issues")
async def getGithubIssues():
    github_token = os.getenv("GITHUB_TOKEN")

    if not github_token:
        raise HTTPException(
            status_code=503,
            detail="GITHUB_TOKEN is not configured on the backend",
        )

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {
        "filter": "assigned",
        "state": "all",
        "sort": "updated",
        "direction": "desc",
        "per_page": 100,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://api.github.com/issues",
            headers=headers,
            params=params,
        )

    if response.status_code >= 400:
        detail = response.json().get("message", "Unable to load GitHub issues")
        raise HTTPException(status_code=response.status_code, detail=detail)

    issues = [issue for issue in response.json() if "pull_request" not in issue]
    return [serialize_github_issue(issue) for issue in issues]

@router.get("/{shortCode}") 
async def getLongUrl(shortCode: str, request:Request, db: Session = Depends(get_db)): 
    
    link = db.query(Link).filter(Link.shortCode == shortCode).first() 
    
    if not link:
        return {"message": "Link not found"} 
    if link.status != "ACTIVE":
        return {"message": "Link disabled"} 
    
    clientIp = request.headers.get(
    "x-forwarded-for",
    request.client.host
).split(" ")[0].strip(",") # Taking the first IP
    
    
    geoData = geoLocation.getGeoData( clientIp )  
    eventId= str( uuid.uuid4() ) 
    ipHash = hashlib.sha256( clientIp.encode() ).hexdigest() 
    userAgent = request.headers.get("user-agent") 
    
    clickEvent = ClickEvent(
        eventId=eventId ,
        shortCode=shortCode ,
        
        ipHash=ipHash ,
        userAgent=userAgent ,
        
        country=geoData.get("country") ,
        region = geoData.get("regionName") ,
        city=geoData.get("city") ,
        timezone=geoData.get("timezone") ,
        isp=geoData.get("isp") ,
    ) 
    
    db.add(clickEvent)
    db.commit() 
       
    return RedirectResponse(url=link.longUrl)
    
