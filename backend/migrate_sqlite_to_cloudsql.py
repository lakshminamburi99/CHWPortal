#!/usr/bin/env python3
"""
migrate_sqlite_to_cloudsql.py
-------------------------------------------------
Reads every row from local chw_care.db (SQLite)
and upserts it into the connected PostgreSQL / Cloud SQL database.

Usage (from the backend/ directory):
    DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/chw_care_db \
        python migrate_sqlite_to_cloudsql.py

In GitHub Actions the proxy forwards localhost:5432 → Cloud SQL socket.
"""
import os
import sys
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, text, inspect


# ── 1. Resolve paths ──────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent          # backend/
SQLITE_FILE = BACKEND_DIR / "chw_care.db"

if not SQLITE_FILE.exists():
    print(f"[migrate] ERROR: {SQLITE_FILE} not found.", file=sys.stderr)
    sys.exit(1)


# ── 2. Build PostgreSQL engine ────────────────────────────────────────────────
import urllib.parse

DB_URL = os.environ.get("DATABASE_URL") or os.environ.get("MIGRATE_DATABASE_URL")
if not DB_URL:
    pg_user = os.environ.get("PG_USER", "postgres")
    pg_pass = os.environ.get("PG_PASSWORD", "")
    pg_host = os.environ.get("PG_HOST", "localhost")
    pg_port = os.environ.get("PG_PORT", "5432")
    pg_db = os.environ.get("PG_DB", "")
    
    if pg_pass and pg_db:
        pg_pass_encoded = urllib.parse.quote_plus(pg_pass)
        DB_URL = f"postgresql+psycopg2://{pg_user}:{pg_pass_encoded}@{pg_host}:{pg_port}/{pg_db}"

if not DB_URL:
    print("[migrate] ERROR: DATABASE_URL or components not set.", file=sys.stderr)
    sys.exit(1)

# Ensure psycopg2 driver prefix if a raw URL was provided
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

print(f"[migrate] Connecting to PostgreSQL: {DB_URL[:80]}...", file=sys.stderr)
pg_engine = create_engine(DB_URL, pool_pre_ping=True)

# Verify connection
with pg_engine.connect() as conn:
    conn.execute(text("SELECT 1"))
print("[migrate] PostgreSQL connection OK.", file=sys.stderr)


# ── 3. Create all tables from ORM models ──────────────────────────────────────
sys.path.insert(0, str(BACKEND_DIR))
from app.models import Base

print("[migrate] Creating tables in PostgreSQL (if not exist)...", file=sys.stderr)
Base.metadata.create_all(bind=pg_engine)
print("[migrate] Tables ready.", file=sys.stderr)


# ── 4. Read SQLite and migrate row by row ─────────────────────────────────────
# Insertion order respects foreign key dependencies
ORDERED_TABLES = [
    "organizations", "regions", "districts", "teams", "org_units",
    "roles", "permissions", "roles_permissions",
    "users", "user_roles", "platform_users", "chws",
    "patients", "patient_contacts", "patient_assignments", "patient_status_history",
    "assessment_templates", "assessment_template_versions", "assessment_sections",
    "assessment_questions", "assessment_options",
    "case_records", "risk_results", "risk_flags",
    "referrals", "followups",
    "cases", "case_notes", "case_reviews", "case_escalations", "case_status_history",
    "assessments", "assessment_answers", "assessment_results",
    "training_lessons", "system_services", "role_definitions", "program_metrics",
    "system_settings", "direct_messages", "notifications", "user_notifications",
    "audit_events", "audit_logs", "sessions", "password_reset_tokens",
]

sqlite_conn = sqlite3.connect(str(SQLITE_FILE))
sqlite_c = sqlite_conn.cursor()

# Get all tables present in SQLite
sqlite_c.execute("SELECT name FROM sqlite_master WHERE type='table';")
sqlite_tables = {r[0] for r in sqlite_c.fetchall()}

# Get PostgreSQL inspector to check for columns
pg_inspector = inspect(pg_engine)

total_migrated = 0

with pg_engine.begin() as pg_conn:
    # Disable FK checks during bulk insert
    pg_conn.execute(text("SET session_replication_role = replica;"))

    for table in ORDERED_TABLES:
        if table not in sqlite_tables:
            continue

        sqlite_c.execute(f'SELECT * FROM "{table}";')
        rows = sqlite_c.fetchall()
        if not rows:
            print(f"[migrate]   {table:<40} SKIPPED (no rows)")
            continue

        col_names = [d[0] for d in sqlite_c.description]

        # Only use columns that exist in the PG table to avoid schema drift
        pg_cols = {col["name"] for col in pg_inspector.get_columns(table)}
        valid_cols = [c for c in col_names if c in pg_cols]

        if not valid_cols:
            print(f"[migrate]   {table:<40} SKIPPED (no matching columns in PG)")
            continue

        cols_sql  = ", ".join(f'"{c}"' for c in valid_cols)
        params_sql = ", ".join(f":{c}" for c in valid_cols)
        upsert_sql = text(
            f'INSERT INTO "{table}" ({cols_sql}) VALUES ({params_sql}) ON CONFLICT DO NOTHING;'
        )

        count = 0
        for row in rows:
            row_dict = {c: v for c, v in zip(col_names, row) if c in pg_cols}
            try:
                pg_conn.execute(upsert_sql, row_dict)
                count += 1
            except Exception as ex:
                print(f"[migrate]   {table} row error: {ex}", file=sys.stderr)

        total_migrated += count
        print(f"[migrate]   {table:<40} → {count} rows inserted/skipped")

    pg_conn.execute(text("SET session_replication_role = DEFAULT;"))

sqlite_conn.close()
print(f"\n[migrate] ✅ Migration complete. {total_migrated} total rows migrated to Cloud SQL.")
