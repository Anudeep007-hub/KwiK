from sqlalchemy import text

from db_config import engine


def ensure_runtime_schema():
    """Add columns introduced after initial create_all() deployments."""
    with engine.begin() as connection:
        connection.execute(text('ALTER TABLE links ADD COLUMN IF NOT EXISTS "ownerId" VARCHAR'))
        connection.execute(text('ALTER TABLE click_events ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64)'))
        connection.execute(text('CREATE INDEX IF NOT EXISTS ix_links_ownerId ON links ("ownerId")'))
        connection.execute(text('CREATE INDEX IF NOT EXISTS ix_click_events_userId ON click_events ("userId")'))
