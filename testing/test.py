from fastapi import FastAPI, Request
from user_agents import parse

app = FastAPI()

@app.get("/")
def home(req:Request):
    headerData = req.headers 
    
    browserInfo = headerData.get("sec-ch-ua") 
    
    if "Brave" in browserInfo:
        print("Brave")  
    if "Google Chrome" in browserInfo:
        print("Google Chrome") 
    if "Microsoft Edge" in browserInfo:
        print("Microsoft Edge") 
    if "Opera" in browserInfo:
        print("Opera")
    
    print(f"headerData: {headerData.get("sec-ch-ua")}")
    return {"message": "I'm alive"}