import os

from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware

# Local imports
from routes import router
from db_config import Base, engine 
from services.schema import ensure_runtime_schema

Base.metadata.create_all(bind=engine)

app = FastAPI()

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
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

app.include_router(router)

@app.get("/")
def home():
    return {"message":"I'm alive"}
