from sqlalchemy import Column, Integer, Boolean, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
# Local imports
from backend.db_config import Base

class ClickEvent(Base):
    
    __tablename__ = "click_events" 
    
    eventId = Column(String, primary_key=True)
    shortCode = Column(String(16), ForeignKey("links.shortCode")) 
    timestamp = Column(TIMESTAMP, server_default=func.now(), index=True) 
    ipHadh = Column(String(64))
    userAgent = Column(String(512))
    referrer = Column(String(2048), nullable=True)
    
    