from pydantic import BaseModel 

class updateUserRequest(BaseModel):
    name: str
    