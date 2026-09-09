"""
app/core/auth.py

DEPRECATED SHIM. This file used to contain its own JWT auth with a
hardcoded admin email/password AND a fallback that granted admin access
to any request with an invalid or missing token. That was a severe
auth-bypass bug and has been removed entirely -- nothing in this file
grants access on its own anymore.

The real, correct auth system is app/core/firebase_auth.py (verifies a
real Firebase ID token via firebase_admin). Every route in this project
should import get_current_user from there, not from here.

This shim only exists so that if any other file still does
`from app.core.auth import get_current_user`, it keeps working -- but
now it's the SAME secure function, not a bypass.
"""
from app.core.firebase_auth import get_current_user, get_current_uid  # noqa: F401
