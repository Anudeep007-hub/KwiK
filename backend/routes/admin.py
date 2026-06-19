import os

from fastapi import APIRouter, Header, HTTPException

from services.schema import ensure_runtime_schema

router = APIRouter(prefix="/v1/admin", tags=["admin"])


@router.post("/migrate")
async def run_runtime_migration(x_admin_secret: str | None = Header(None)):
    """Run the small runtime migration for deployments without Alembic."""
    expected_secret = os.getenv("ADMIN_MIGRATION_SECRET")

    if not expected_secret or x_admin_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Forbidden")

    ensure_runtime_schema()
    return {"message": "Runtime schema migration completed"}
