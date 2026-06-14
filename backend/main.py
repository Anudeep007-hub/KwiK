from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware

# Local imports
from backend.routes.router import router
from backend.db_config import Base, engine 

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware( 
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

app.include_router(router)

@app.get("/")
def home():
    return {"message":"I'm alive"}


