from sqlalchemy import Column, Integer, Boolean, String, TIMESTAMP, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
# Local imports 
from db_config import Base

class LinkStatus(str, Enum):
    ACTIVE = "ACTIVE" 
    DESABLED = "DISABLED"

class Link(Base):

    __tablename__ = "links" 
    
    shortCode = Column(String(16), primary_key=True) 
    longUrl = Column(String(2048), nullable=False) 
    createdAt = Column(TIMESTAMP, server_default=func.now(), nullable=False) 
    expiresAt = Column(TIMESTAMP, nullable=True) 
    status = Column(SQLEnum(LinkStatus), nullable=False)
    ownerId = Column(String, nullable=True)
