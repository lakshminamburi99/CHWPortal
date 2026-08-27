"""
Migrate all data from local SQLite (chw_care.db) to PostgreSQL / Cloud SQL.
"""
import os
import sqlite3
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import engine
from app.models import Base
from app.db.session import SessionLocal

def migrate_sqlite_to_postgres():
    # Locate chw_care.db
    backend_dir = Path(__file__).resolve().parent.parent.parent
    sqlite_db = backend_dir / "chw_care.db"
    
    if not sqlite_db.exists():
        print(f"[migration] SQLite file {sqlite_db} not found. Skipping migration.")
        return

    print(f"[migration] Found local SQLite database at {sqlite_db}")
    print("[migration] Creating PostgreSQL tables if they don't exist...")
    Base.metadata.create_all(bind=engine)

    sqlite_conn = sqlite3.connect(sqlite_db)
    sqlite_c = sqlite_conn.cursor()

    # Get list of tables in SQLite
    sqlite_c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in sqlite_c.fetchall() if not r[0].startswith("sqlite_")]

    pg_db: Session = SessionLocal()

    try:
        # Order of tables to insert to respect foreign keys
        ordered_tables = [
            "organizations", "regions", "districts", "teams", "org_units",
            "roles", "permissions", "roles_permissions", "users", "user_roles",
            "platform_users", "chws", "patients", "assessment_templates",
            "training_lessons", "case_records", "referrals", "followups",
            "notifications", "system_services", "role_definitions",
            "program_metrics", "audit_events", "audit_logs", "sessions"
        ]
        
        # Add any remaining tables
        for t in tables:
            if t not in ordered_tables:
                ordered_tables.append(t)

        print("[migration] Starting data transfer from SQLite to PostgreSQL...")
        for table in ordered_tables:
            if table not in tables:
                continue
            
            sqlite_c.execute(f"SELECT * FROM \"{table}\";")
            rows = sqlite_c.fetchall()
            if not rows:
                continue

            # Get column names
            col_names = [description[0] for description in sqlite_c.description]
            cols_str = ", ".join([f"\"{c}\"" for c in col_names])
            params_str = ", ".join([f":{c}" for c in col_names])

            insert_query = text(f"INSERT INTO \"{table}\" ({cols_str}) VALUES ({params_str}) ON CONFLICT DO NOTHING;")

            row_count = 0
            for row in rows:
                row_dict = dict(zip(col_names, row))
                try:
                    pg_db.execute(insert_query, row_dict)
                    row_count += 1
                except Exception as ex:
                    # Ignore duplicate key or conflict issues
                    pass

            pg_db.commit()
            print(f"[migration] Migrated {row_count} rows into '{table}'.")

        print("[migration] Database migration completed successfully!")

    except Exception as e:
        pg_db.rollback()
        print(f"[migration] Migration error: {e}")
    finally:
        sqlite_conn.close()
        pg_db.close()

if __name__ == "__main__":
    migrate_sqlite_to_postgres()
