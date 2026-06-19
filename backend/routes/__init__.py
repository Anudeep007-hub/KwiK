"""Routes package - consolidated router imports"""

from fastapi import APIRouter
from routes.links import router as links_router
from routes.analytics import router as analytics_router
from routes.github import router as github_router
from routes.redirect import router as redirect_router
from routes.auth_routes import router as auth_router

# Create a combined router for easy inclusion in main.py
router = APIRouter()

# Include all sub-routers
router.include_router(auth_router)
router.include_router(links_router)
router.include_router(analytics_router)
router.include_router(github_router)
router.include_router(redirect_router)

__all__ = [
    "router",
    "auth_router",
    "links_router",
    "analytics_router",
    "github_router",
    "redirect_router",
]
