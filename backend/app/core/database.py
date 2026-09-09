import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Vercel's serverless filesystem is read-only except /tmp.
# Locally (VERCEL env var unset) we keep using the real file
# so your data persists across local runs.
DB_PATH = "/tmp/agrisaathi.db" if os.environ.get("VERCEL") else "./agrisaathi.db"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
