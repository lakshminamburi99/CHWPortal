import os
from sqlalchemy import create_engine, text

def migrate():
    pg_url = "postgresql://chw_app:changeme@localhost:5432/chw_care_db"
    engine = create_engine(pg_url)

    with engine.begin() as conn:
        print("Adding open_cases column to org_units...")
        try:
            conn.execute(text("ALTER TABLE org_units ADD COLUMN open_cases INTEGER DEFAULT 0;"))
            print("Column added.")
        except Exception as e:
            print("Column might already exist:", e)
        
        print("Updating type CLINIC to TEAM...")
        conn.execute(text("UPDATE org_units SET type = 'TEAM' WHERE type = 'CLINIC';"))
        
        # Also give some mock open_cases data to existing teams
        conn.execute(text("UPDATE org_units SET open_cases = 12 WHERE id = 'FTA';"))
        
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
