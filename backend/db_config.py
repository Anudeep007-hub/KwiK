from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker 
import urllib 
from sqlalchemy.ext.declarative import declarative_base 
 
Base = declarative_base()

PASSWORD = f"Xxfhifnh@1728121" 
encoded_password = urllib.parse.quote_plus(PASSWORD) 

DB_URL = f"postgresql://postgres:{encoded_password}@localhost:5432/kwik_ink"

engine = create_engine(DB_URL)

SessionLocal = sessionmaker(autoflush=False, bind=engine) 