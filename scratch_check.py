import sqlite3
import psycopg2

def check_sqlite():
    try:
        conn = sqlite3.connect('backend/chw_care.db')
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = c.fetchall()
        print("SQLite tables:")
        for t in tables:
            table_name = t[0]
            c.execute(f"SELECT count(*) FROM {table_name}")
            print(f"  {table_name}: {c.fetchone()[0]} rows")
        conn.close()
    except Exception as e:
        print("SQLite error:", e)

def check_postgres():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password="postgres",
            dbname="chw_care_db"
        )
        c = conn.cursor()
        c.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = c.fetchall()
        print("\nPostgres tables:")
        for t in tables:
            table_name = t[0]
            c.execute(f"SELECT count(*) FROM {table_name}")
            print(f"  {table_name}: {c.fetchone()[0]} rows")
        conn.close()
    except Exception as e:
        print("Postgres error:", e)

if __name__ == "__main__":
    check_sqlite()
    check_postgres()
