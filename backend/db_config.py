from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker 
from sqlalchemy.ext.declarative import declarative_base 
import os
import dotenv

dotenv.load_dotenv()

DB_URL = os.getenv("DB_URL")

if not DB_URL:
    raise Exception(
        "DB_URL environment variable not found"
    )

if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )
    
engine = create_engine(DB_URL, pool_size=50, max_overflow=100)

SessionLocal = sessionmaker(autoflush=False, bind=engine) 

Base = declarative_base()
