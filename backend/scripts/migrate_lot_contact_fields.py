"""
One-off migration: add farmer_phone, farmer_email, latitude, longitude
to the lots table. Safe to run repeatedly — skips columns that already
exist. Works against both local SQLite and Postgres (Neon).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

COLUMNS = {
    "farmer_phone": "VARCHAR",
    "farmer_email": "VARCHAR",
    "latitude": "FLOAT",
    "longitude": "FLOAT",
}

with engine.connect() as conn:
    is_sqlite = engine.dialect.name == "sqlite"

    if is_sqlite:
        existing = {
            row[1] for row in conn.execute(text("PRAGMA table_info(lots)"))
        }
    else:
        existing = {
            row[0]
            for row in conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'lots'"
                )
            )
        }

    for name, sql_type in COLUMNS.items():
        if name in existing:
            print(f"skip {name} (already present)")
            continue
        conn.execute(text(f"ALTER TABLE lots ADD COLUMN {name} {sql_type}"))
        conn.commit()
        print(f"added {name} {sql_type}")

print("Migration complete.")
