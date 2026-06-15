from sqlalchemy import Column, Integer, Boolean, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
# Local imports
from backend.db_config import Base

class ClickEvent(Base):
    
    __tablename__ = "click_events" 
    
    eventId = Column(String(32), primary_key=True)
    shortCode = Column(String(16), ForeignKey("links.shortCode")) 
    timestamp = Column(TIMESTAMP, server_default=func.now(), index=True) 
    ipHash = Column(String(128))
    userAgent = Column(String(512))
    referrer = Column(String(2048), nullable=True) 
    country = Column(String(100), nullable=True) 
    region = Column(String(100), nullable=True) 
    city = Column(String(200), nullable=True) 
    timezone = Column(String(100), nullable=True) 
    isp = Column(String(300), nullable=True)
    
    