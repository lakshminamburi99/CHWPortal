import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.sync_database_url

connect_args: dict = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

print(f"[db] Connecting to database: {db_url[:80]}...", file=sys.stderr, flush=True)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
