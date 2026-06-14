from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
# Local imports
from backend.services import base62Converter, uniqueIDGenerator
  
from backend.models.requests.linkRequest import LinkRequest 
from backend.models.Link import Link
from backend.models.ClickEvent import ClickEvent 
from backend.models.Link import LinkStatus
from backend.database.session import SessionLocal, get_db




router = APIRouter()

@router.post("/v1/links") 
async def getTinyUrl(req: LinkRequest, db: Session = Depends(get_db)): 
    uniqueID = uniqueIDGenerator.getUniqueID() 
    shortCode = base62Converter.getBase62(uniqueID) 
    
    link = Link(shortCode=shortCode, 
                longUrl=req.longUrl,
                status=LinkStatus.ACTIVE) 
    db.add(link)
    db.commit() 
    db.refresh(link)
    
    return {"shortCode":shortCode} 

@router.get("/{shortCode}") 
async def getLongUrl(shortCode: str, db: Session = Depends(get_db)): 
    
    link = db.query(Link).filter(Link.shortCode == shortCode).first() 
    
    if not link:
        return {"message": "Link not found"} 
    if link.status != "ACTIVE":
        return {"message": "Link disabled"}
    
    return RedirectResponse(url=link.longUrl)
    


