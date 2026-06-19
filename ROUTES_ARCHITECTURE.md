# Routes Architecture - Scalable Modular Design

## Overview

The `backend/routes/` directory has been refactored into a **feature-based modular structure** for better scalability and maintainability.

## Directory Structure

```
backend/routes/
├── __init__.py              # Package initialization - consolidates all routers
├── router.py                # Backward compatibility module
├── auth_routes.py           # Authentication endpoints (OAuth, JWT, user profile)
├── links.py                 # Link CRUD operations (POST, GET, PATCH)
├── analytics.py             # Click event tracking and analytics
├── github.py                # GitHub integration (issues)
├── redirect.py              # Public URL redirect (short code → long URL)
└── serializers.py           # Response serialization utilities
```

## Module Descriptions

### 1. **auth_routes.py**
Authentication and user management endpoints.

**Routes:**
- `GET /v1/auth/login/github` - GitHub OAuth URL
- `GET /v1/auth/login/google` - Google OAuth URL
- `POST /v1/auth/callback/github` - GitHub callback handler
- `POST /v1/auth/callback/google` - Google callback handler
- `GET /v1/auth/me` - Current user profile
- `PATCH /v1/auth/me` - Update user profile
- `POST /v1/auth/logout` - Logout

### 2. **links.py**
Shortened URL management (CRUD operations).

**Routes:**
- `POST /v1/links` - Create short link
- `GET /v1/links` - List user's links
- `GET /v1/links/{shortCode}` - Get link details
- `PATCH /v1/links/{shortCode}/status` - Update link status

### 3. **analytics.py**
Click event tracking and analytics data.

**Routes:**
- `GET /v1/click-events` - User's analytics
- `GET /v1/links/{shortCode}/events` - Per-link analytics

### 4. **github.py**
GitHub integration for issue tracking.

**Routes:**
- `GET /v1/github/issues` - User's assigned issues

### 5. **redirect.py**
Public redirect endpoint (no authentication).

**Routes:**
- `GET /{shortCode}` - Redirect to long URL

### 6. **serializers.py**
Shared response serialization functions.

**Functions:**
- `serialize_link()` - Format Link model as API response
- `serialize_click_event()` - Format ClickEvent model as API response
- `serialize_github_issue()` - Format GitHub issue as API response

## How to Add New Routes

### Scenario: Adding a "Link Sharing" feature

**Step 1: Create new route module** (`backend/routes/sharing.py`)
```python
"""Link sharing and collaboration routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from models.Link import Link
from database.session import get_db
from services.dependencies import get_current_user
from routes.serializers import serialize_link

router = APIRouter(prefix="/v1/links", tags=["sharing"])

@router.post("/{shortCode}/share")
async def share_link(
    shortCode: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Share a link with other users"""
    user_id = current_user.get("sub")
    
    link = db.query(Link).filter(
        Link.shortCode == shortCode,
        Link.ownerId == user_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Your sharing logic here
    return {"status": "shared"}
```

**Step 2: Update `backend/routes/__init__.py`**
```python
from routes.sharing import router as sharing_router

router.include_router(sharing_router)

__all__ = [
    # ... existing exports
    "sharing_router",
]
```

**Step 3: Done!** The route is automatically available.

## Dependencies

All route modules follow this pattern:
- ✅ Use `Depends(get_db)` for database session
- ✅ Use `Depends(get_current_user)` for authentication
- ✅ Import serializers from `routes.serializers`
- ✅ Use descriptive function names (snake_case)

## How the Routing Works

```
main.py
  ├─> from routes import router
  └─> app.include_router(router)
       └─> routes/__init__.py
            ├─> routes/auth_routes.py
            ├─> routes/links.py
            ├─> routes/analytics.py
            ├─> routes/github.py
            └─> routes/redirect.py
```

All individual routers are consolidated in `__init__.py`, which creates a single `router` object for easy inclusion in `main.py`.

## Future Scaling Considerations

### When to Split Further

If any module grows beyond **~300 lines**, consider splitting into sub-modules:

```
backend/routes/
├── links/
│   ├── __init__.py
│   ├── crud.py          # Create, Read, Update, Delete
│   ├── status.py        # Status management
│   └── validation.py    # Input validation
├── analytics/
│   ├── __init__.py
│   ├── events.py        # Click events
│   └── reports.py       # Aggregated reports
└── ...
```

### Adding Middleware

Route-specific middleware can be added like:
```python
@router.middleware("http")
async def add_rate_limit(request, call_next):
    # Rate limiting logic
    return await call_next(request)
```

## Best Practices

1. **One responsibility per module** - Keep concerns separated
2. **Use descriptive names** - `get_user_click_events()` > `get_events()`
3. **Shared utilities in serializers.py** - Avoid duplication
4. **Dependencies first** - `Depends()` parameters before business logic
5. **Docstrings** - Each endpoint should have a docstring
6. **Error handling** - Use appropriate HTTP status codes

## Backward Compatibility

The old `router.py` still exists as a compatibility shim, so any external imports from it will continue to work. However, new code should use the modular structure directly.

## Testing

When testing individual routes, import directly from the module:

```python
from routes.links import router as links_router
from routes.analytics import router as analytics_router

# In your test setup:
test_app = FastAPI()
test_app.include_router(links_router)
test_app.include_router(analytics_router)
```

---

**This architecture makes it easy to:**
- ✅ Find specific route logic quickly
- ✅ Add new features without modifying existing code
- ✅ Write unit tests for individual route groups
- ✅ Scale to 100+ routes without chaos
- ✅ Onboard new developers faster
