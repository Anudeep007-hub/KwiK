from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import hashlib 
import uuid
# Local imports
from services import base62Converter, uniqueIDGenerator, geoLocation
  

from models.requests.linkRequest import LinkRequest 
from models.Link import Link
from models.ClickEvent import ClickEvent 
from models.Link import LinkStatus
from database.session import SessionLocal, get_db




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
async def getLongUrl(shortCode: str, request:Request, db: Session = Depends(get_db)): 
    
    link = db.query(Link).filter(Link.shortCode == shortCode).first() 
    
    if not link:
        return {"message": "Link not found"} 
    if link.status != "ACTIVE":
        return {"message": "Link disabled"} 
    
    clientIp = request.client.host 
    geoData = geoLocation.getGeoData( clientIp )  
    eventId= str( uuid.uuid4() ) 
    ipHash = hashlib.sha256( clientIp.encode() ).hexdigest() 
    userAgent = request.headers.get("user-agent") 
    referer = request.headers.get("referer") 
    
    
    clickEvent = ClickEvent(
        eventId=eventId ,
        shortCode=shortCode ,
        
        ipHash=ipHash ,
        userAgent=userAgent ,
        referer=referer ,
        
        country=geoData.get("country") ,
        region = geoData.get("regionName") ,
        city=geoData.get("city") ,
        timezone=geoData.get("timezone") ,
        isp=geoData.get("isp") ,
    ) 
    
    db.add(clickEvent)
    db.commit() 
       
    return RedirectResponse(url=link.longUrl)
    


