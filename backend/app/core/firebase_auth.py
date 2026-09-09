"""
firebase_auth.py

Verifies the Firebase ID token sent by the frontend on each request and
exposes the caller's Firebase UID (and decoded claims) to route handlers.

Frontend must send: Authorization: Bearer <idToken>
Get the token client-side with: await auth.currentUser.getIdToken()
"""

from pathlib import Path
import json
import os

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth_sdk
from firebase_admin import credentials

from app.core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)

# Initialize the Firebase Admin app once, on import.
#
# Production (Vercel):
#   FIREBASE_SERVICE_ACCOUNT_JSON contains the service-account JSON.
#
# Local development:
#   firebase-service-account.json is used as a safe fallback.
#
# NEVER commit the service-account JSON to Git.
if not firebase_admin._apps:
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()

    if service_account_json:
        try:
            service_account_info = json.loads(service_account_json)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
            ) from exc

        firebase_admin.initialize_app(
            credentials.Certificate(service_account_info)
        )
    else:
        cred_path = Path(settings.firebase_service_account_path)

        if not cred_path.is_absolute():
            cred_path = Path(__file__).resolve().parents[2] / cred_path

        if not cred_path.exists():
            raise RuntimeError(
                f"Firebase credentials unavailable. Expected either "
                f"FIREBASE_SERVICE_ACCOUNT_JSON or local file at {cred_path}."
            )

        firebase_admin.initialize_app(
            credentials.Certificate(str(cred_path))
        )


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
