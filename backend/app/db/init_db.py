from sqlalchemy import text
from app.db.session import engine
from app.models import Base

def init_db():
    print("Creating database tables dynamically via ORM metadata...")
    Base.metadata.create_all(bind=engine)

    # Safe migration: ensure newly added columns exist in existing tables
    with engine.connect() as conn:
        for table, col, col_type in [
            ("users", "avatar", "TEXT"),
            ("users", "phone", "VARCHAR(32)"),
            ("platform_users", "avatar", "TEXT"),
            ("platform_users", "phone", "VARCHAR(32)"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                # Column already exists or table handles it
                pass

    print("All database tables and columns synchronized successfully!")

if __name__ == "__main__":
    init_db()
