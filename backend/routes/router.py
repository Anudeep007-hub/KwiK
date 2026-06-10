from fastapi import APIRouter
# Local imports
from backend.services import base62Converter, uniqueIDGenerator   


router = APIRouter()

@router.get("/v1/links") 
async def getTinyUrl(longUrl:str): 
    uniqueID = uniqueIDGenerator.getUniqueID() 
    shortCode = base62Converter.getBase62(uniqueID) 
    
    return {"message":shortCode}
    


