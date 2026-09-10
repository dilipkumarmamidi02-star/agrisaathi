import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

COLUMNS = {
    "latitude": "FLOAT",
    "longitude": "FLOAT",
}

with engine.begin() as conn:
    if engine.dialect.name == "sqlite":
        existing = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(users)"))
        }
    else:
        existing = {
            row[0]
            for row in conn.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'users'
                """)
            )
        }

    for name, sql_type in COLUMNS.items():
        if name in existing:
            print(f"skip users.{name}")
        else:
            conn.execute(
                text(f"ALTER TABLE users ADD COLUMN {name} {sql_type}")
            )
            print(f"added users.{name}")

print("Profile location migration complete.")
