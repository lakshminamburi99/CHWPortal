import sqlite3

def migrate():
    print("Migrating program_metrics to add owner_id...")
    conn = sqlite3.connect("chw_care.db")
    cursor = conn.cursor()

    # 1. Add column
    try:
        cursor.execute("ALTER TABLE program_metrics ADD COLUMN owner_id VARCHAR;")
        print("Added owner_id column.")
    except sqlite3.OperationalError as e:
        print(f"Column might already exist: {e}")

    # 2. Update owner_id based on users
    cursor.execute("SELECT id, display_name, first_name, last_name FROM users;")
    users = cursor.fetchall()
    
    for u in users:
        uid = u[0]
        name = u[1] if u[1] else f"{u[2]} {u[3]}"
        
        cursor.execute(
            "UPDATE program_metrics SET owner_id = ? WHERE owner = ?",
            (uid, name)
        )
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
