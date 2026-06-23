"""
Backward compatibility module - routes have been refactored into separate modules.
See the following files for the new structure:
- routes/links.py        - Link CRUD operations
- routes/analytics.py    - Click event and analytics endpoints
- routes/github.py       - GitHub integration
- routes/redirect.py     - Public URL redirect
- routes/auth_routes.py  - Authentication endpoints
"""

from fastapi import APIRouter
from routes.links import router as links_router
from routes.analytics import router as analytics_router
from routes.redirect import router as redirect_router 


# Combined router for backward compatibility
router = APIRouter()
router.include_router(links_router) 
router.include_router(analytics_router)
router.include_router(redirect_router)

__all__ = ["router"]

    
