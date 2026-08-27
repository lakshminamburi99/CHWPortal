import psycopg2

def check_postgres():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="chw_app",
            password="changeme",
            dbname="chw_care_db"
        )
        c = conn.cursor()
        c.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = c.fetchall()
        print("\nPostgres tables:")
        if not tables:
            print("  No tables found in public schema.")
        for t in tables:
            table_name = t[0]
            c.execute(f"SELECT count(*) FROM {table_name}")
            print(f"  {table_name}: {c.fetchone()[0]} rows")
        conn.close()
    except Exception as e:
        print("Postgres error:", e)

if __name__ == "__main__":
    check_postgres()
