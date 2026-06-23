"""GitHub integration routes for issue tracking"""

import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from models.User import User
from database.session import get_db
from services.dependencies import get_current_user
from routes.serializers import serialize_github_issue

router = APIRouter(prefix="/v1", tags=["github"])


@router.get("/github/issues")
async def get_github_issues(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get GitHub issues for the authenticated user"""
    user_id = current_user.get("sub")



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
