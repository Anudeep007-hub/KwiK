from fastapi import FastAPI 
from backend.routes.router import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def home():
    return {"I'm alive"}

@app.get("/test")
def test():
    return {"messsage": "I'm alive"}

