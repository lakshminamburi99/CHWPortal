import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.sync_database_url

connect_args: dict = {}
pool_kwargs: dict = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # ── Production-Grade Connection Pooling & Timeout Settings ───────────────
    # Configure connection pool for secure, high-performance PostgreSQL/Cloud SQL
    pool_kwargs = {
        "pool_size": 10,          # Keep up to 10 connections open in the pool
        "max_overflow": 20,       # Allow up to 20 temporary connections beyond pool_size
        "pool_timeout": 30,       # Wait up to 30 seconds for a connection from the pool
        "pool_recycle": 1800,     # Recycle connections every 30 mins to avoid idle timeouts
    }

print(f"[db] Connecting to database: {db_url[:80]}...", file=sys.stderr, flush=True)

engine = create_engine(
    db_url,
    pool_pre_ping=True,        # Test connection health before using (liveness check)
    connect_args=connect_args,
    echo=False,                # Protect sensitive data log leaks
    **pool_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
