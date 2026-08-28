import os
import sys
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.seed_test_data import seed_twenty_test_patients

def main():
    parser = argparse.ArgumentParser(description="Seed 20 test patients into PostgreSQL/Cloud SQL.")
    parser.add_argument("--db-url", help="Database URL (overrides DATABASE_URL env var)")
    args = parser.parse_args()

    db_url = args.db_url or os.environ.get("DATABASE_URL") or os.environ.get("MIGRATE_DATABASE_URL")
    if not db_url:
        from app.config import settings
        db_url = settings.sync_database_url

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    print(f"Connecting to database to seed test patients: {db_url[:80]}...")
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        seed_twenty_test_patients(db)
    except Exception as e:
        print(f"Error seeding test data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
