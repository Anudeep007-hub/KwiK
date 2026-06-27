import os

from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

# Local imports
from routes import router
from db_config import Base, engine 

Base.metadata.create_all(bind=engine)


def ensure_schema_compatibility():
    """Small compatibility bridge until the project has a migration runner."""

    inspector = inspect(engine)

    if "click_events" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("click_events")}

    if "geoStatus" in columns:
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE click_events "
                "ADD COLUMN \"geoStatus\" VARCHAR(16) NOT NULL DEFAULT 'PENDING'"
            )
        )


ensure_schema_compatibility()

app = FastAPI()

default_origins = [
    "https://kwi-k.vercel.app",
    "https://kwik.ink",
    "https://www.kwik.ink",
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
