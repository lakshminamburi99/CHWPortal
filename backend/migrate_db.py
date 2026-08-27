import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import all models to ensure they are registered with Base.metadata
from app.models import Base
import app.models

def migrate():
    sqlite_url = "sqlite:///./chw_care.db"
    sqlite_engine = create_engine(sqlite_url)
    
    pg_url = "postgresql://chw_app:changeme@localhost:5432/chw_care_db"
    pg_engine = create_engine(pg_url)

    print("Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)

    with pg_engine.begin() as pg_conn:
        print("Disabling foreign key constraints...")
        pg_conn.execute(text("SET session_replication_role = 'replica';"))

        with sqlite_engine.connect() as sqlite_conn:
            for table in Base.metadata.sorted_tables:
                print(f"Migrating table: {table.name}")
                
                # Clear destination
                pg_conn.execute(table.delete())
                
                # Read from sqlite
                rows = sqlite_conn.execute(table.select()).fetchall()
                
                if rows:
                    dicts = [dict(row._mapping) for row in rows]
                    pg_conn.execute(table.insert(), dicts)
                    print(f"  -> Migrated {len(rows)} rows.")
                else:
                    print(f"  -> No data to migrate.")
        
        print("Re-enabling foreign key constraints...")
        pg_conn.execute(text("SET session_replication_role = 'origin';"))
        
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
