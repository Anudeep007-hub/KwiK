from sqlalchemy import Column, String, TIMESTAMP
from sqlalchemy.sql import func
# Local imports
from db_config import Base

class User(Base):
    
    __tablename__ = "users" 
    
    id = Column(String(64), primary_key=True) 
    provider = Column(String(64), nullable=False)
    providerUserId = Column(String(200), unique=True, nullable=False) 
    
    email = Column(String(255), unique=True, nullable=False) 
    name = Column(String(255))
    
    createdAt = Column(TIMESTAMP, server_default=func.now())
    
    