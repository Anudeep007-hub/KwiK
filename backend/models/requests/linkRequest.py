from pydantic import BaseModel 

class LinkRequest(BaseModel):
    longUrl: str