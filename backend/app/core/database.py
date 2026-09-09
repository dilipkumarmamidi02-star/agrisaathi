import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Prefer a real, persistent database (e.g. Postgres) when DATABASE_URL
# is configured. This matters on Vercel, where the filesystem is
# read-only except /tmp and /tmp itself does not persist across cold
# starts — a SQLite file there loses all data on every cold start.
_raw_url = settings.database_url.strip()

# Strip accidental surrounding quote characters some env-var UIs add.
_raw_url = _raw_url.strip('"').strip("'").strip()

# Only treat this as a real database URL if it actually looks like
# one. Anything else (empty string, stray quotes, placeholder junk)
# falls back to SQLite instead of crashing the whole app at import
# time.
if "://" not in _raw_url:
    _raw_url = ""

if _raw_url:
    # Some providers hand out "postgres://"; SQLAlchemy 2.x requires
    # the "postgresql://" scheme. We use the pg8000 driver (pure
    # Python, no C-extension compilation needed) instead of
    # psycopg2, so it installs cleanly on any Python version.
    if _raw_url.startswith("postgres://"):
        _raw_url = "postgresql://" + _raw_url[len("postgres://"):]
    if _raw_url.startswith("postgresql://"):
        _raw_url = "postgresql+pg8000://" + _raw_url[len("postgresql://"):]
    DATABASE_URL = _raw_url
    connect_args = {}
else:
    DB_PATH = "/tmp/agrisaathi.db" if os.environ.get("VERCEL") else "./agrisaathi.db"
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
