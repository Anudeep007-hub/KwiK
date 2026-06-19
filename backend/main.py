from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware

# Local imports
from routes.router import router
from db_config import Base, engine 

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Keep the deployed frontend origin, and add local Vite origins for the
# FigmaFrontend-based app running from frontend/.
allowed_origins = [
    "https://kwi-k.vercel.app",
    "http://localhost:3002",
]

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

