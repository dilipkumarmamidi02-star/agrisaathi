"""
firebase_auth.py

Verifies the Firebase ID token sent by the frontend on each request and
exposes the caller's Firebase UID (and decoded claims) to route handlers.

Frontend must send: Authorization: Bearer <idToken>
Get the token client-side with: await auth.currentUser.getIdToken()
"""

from pathlib import Path

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth_sdk
from firebase_admin import credentials

from app.core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)

# Initialize the Firebase Admin app once, on import.
if not firebase_admin._apps:
    cred_path = Path(settings.firebase_service_account_path)
    if not cred_path.is_absolute():
        cred_path = Path(__file__).resolve().parents[2] / cred_path
    if not cred_path.exists():
        raise RuntimeError(
            f"Firebase service account file not found at {cred_path}. "
            "Download it from Firebase Console > Project Settings > "
            "Service Accounts > Generate new private key, and place it there."
        )
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """Route dependency: verifies the bearer token, returns decoded claims.

    Use in a route with: user = Depends(get_current_user)
    user["uid"] is the Firebase UID; user["email"] if present, etc.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )
    try:
        return firebase_auth_sdk.verify_id_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )


async def get_current_uid(user: dict = Depends(get_current_user)) -> str:
    """Shorthand dependency when a route only needs the UID."""
    return user["uid"]
