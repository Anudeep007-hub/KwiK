import os

from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# Local imports
from routes import router
from db_config import Base, engine 

Base.metadata.create_all(bind=engine)

app = FastAPI()

def ensure_runtime_schema():
    """Add columns introduced after initial create_all() deployments."""
    with engine.begin() as connection:
        connection.execute(text('ALTER TABLE links ADD COLUMN IF NOT EXISTS "ownerId" VARCHAR'))
        connection.execute(text('ALTER TABLE click_events ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64)'))
        connection.execute(text('CREATE INDEX IF NOT EXISTS ix_links_ownerId ON links ("ownerId")'))
        connection.execute(text('CREATE INDEX IF NOT EXISTS ix_click_events_userId ON click_events ("userId")'))


ensure_runtime_schema()

default_origins = [
    "https://kwi-k.vercel.app",
    "https://kwik.ink",
    "https://www.kwik.ink",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
env_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()]
allowed_origins = [*default_origins, *env_origins]

app.add_middleware( 
    CORSMiddleware,
    allow_origins = allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

app.include_router(router)

@app.get("/")
def home():
    return {"message":"I'm alive"}
