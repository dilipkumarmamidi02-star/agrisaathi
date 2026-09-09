"""
One-time admin bootstrap. Reads credentials from environment variables —
NEVER hardcode credentials in source. Run once:

    cd backend
    python seed_admin.py

Set these in backend/.env first (not .env.example — keep real creds out of
anything you might commit):

    ADMIN_EMAIL=youradmin@example.com
    ADMIN_BOOTSTRAP_PASSWORD=a-strong-password-here

The script creates the admin if it doesn't exist, or updates the password
and role if it does. It marks the account as verified so it can log in
immediately (skipping the normal email-OTP flow, which doesn't make sense
for an admin you're creating yourself from the server).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine  # noqa: E402
from app import models  # noqa: E402
from app.security import hash_password  # noqa: E402

EMAIL = os.environ.get("ADMIN_EMAIL")
PASSWORD = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD")

if not EMAIL or not PASSWORD:
    print(
        "Set ADMIN_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in backend/.env first, "
        "then re-run: python seed_admin.py"
    )
    sys.exit(1)

if len(PASSWORD) < 8:
    print("ADMIN_BOOTSTRAP_PASSWORD is too short — use at least 8 characters.")
    sys.exit(1)

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == EMAIL).first()
    if user:
        user.password_hash = hash_password(PASSWORD)
        user.role = "admin"
        user.is_verified = True
        user.is_active = True
        print(f"Updated existing user {EMAIL} to admin.")
    else:
        user = models.User(
            email=EMAIL,
            full_name="Administrator",
            password_hash=hash_password(PASSWORD),
            role="admin",
            portal_type="farmer",
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        print(f"Created new admin user {EMAIL}.")
    db.commit()
    print("Done. You can log in at /login with this email and password.")
finally:
    db.close()
