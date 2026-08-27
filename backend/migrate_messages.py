import os
from sqlalchemy import create_engine
from app.db.base import Base

# Import all models so Base knows about them
import app.models

def migrate():
    pg_url = "postgresql://chw_app:changeme@localhost:5432/chw_care_db"
    engine = create_engine(pg_url)
    
    print("Creating new tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
