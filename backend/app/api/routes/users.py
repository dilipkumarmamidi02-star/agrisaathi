"""
users.py

Real, per-user profile endpoint backed by the `users` SQLite table and
Firebase ID token verification. Replaces the old file-backed demo stub
(demo_user.json is no longer used).
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Response, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.user import User, UserRole, SUPPORTER_TYPES

router = APIRouter(prefix="/api/users", tags=["users"])


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SupporterRegistration(BaseModel):
    supporter_type: str
    business_name: str
    full_name: str
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None



def _get_or_create(db: Session, uid: str, email: Optional[str]) -> User:
    from app.core.config import settings

    user = db.query(User).filter(User.uid == uid).first()

    if user is None:
        role = (
            UserRole.ADMIN
            if settings.admin_email and email == settings.admin_email
            else UserRole.FARMER
        )

        user = User(
            id=str(uuid.uuid4()),
            uid=uid,
            email=email,
            role=role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    elif (
        settings.admin_email
        and email == settings.admin_email
        and user.role != UserRole.ADMIN
    ):
        # Promote the configured admin account on login as well.
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)

    return user


def _serialize(user: User) -> dict:
    return {
        "full_name": user.full_name,
        "phone": user.phone,
        "email": user.email,
        "state": user.state,
        "district": user.district,
        "village": user.village,
        "address": user.address,
        "preferred_language": user.preferred_language,
        "latitude": user.latitude,
        "longitude": user.longitude,
        "role": user.role.value if user.role else None,
        "supporter_type": user.supporter_type,
        "business_name": user.business_name,
        "verification_status": user.verification_status,
        "email_verified": bool(user.is_verified),
        "email_verified_at": (
            user.email_verified_at.isoformat()
            if user.email_verified_at
            else None
        ),
    }


@router.get("/me")
async def get_me(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    user = _get_or_create(db, current_user["uid"], current_user.get("email"))
    return _serialize(user)


@router.patch("/me")
async def update_me(
    update: UserUpdate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    user = _get_or_create(db, current_user["uid"], current_user.get("email"))
    changes = {k: v for k, v in update.model_dump().items() if v is not None}
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _serialize(user)


# ============================================================
# SUPPORTER REGISTRATION + ADMIN VERIFICATION
# ============================================================

def _require_admin(current_user: dict, db: Session) -> User:
    user = (
        db.query(User)
        .filter(User.uid == current_user["uid"])
        .first()
    )

    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return user


@router.post("/register-supporter")
async def register_supporter(
    payload: SupporterRegistration,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register the currently authenticated Firebase user as a supporter.

    New supporter accounts begin in pending verification status.
    """

    response.headers["Cache-Control"] = "no-store"

    if payload.supporter_type not in SUPPORTER_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid supporter type",
                "allowed_types": SUPPORTER_TYPES,
            },
        )

    if not payload.business_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Business name is required",
        )

    if not payload.full_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    user = _get_or_create(
        db,
        current_user["uid"],
        current_user.get("email"),
    )

    user.role = UserRole.SUPPORTER
    user.supporter_type = payload.supporter_type
    user.business_name = payload.business_name.strip()
    user.full_name = payload.full_name.strip()

    if payload.phone:
        user.phone = payload.phone.strip()

    if payload.latitude is not None:
        user.latitude = payload.latitude
    if payload.longitude is not None:
        user.longitude = payload.longitude

    user.verification_status = "pending"

    db.commit()
    db.refresh(user)

    return _serialize(user)


@router.get("/admin/users")
async def admin_list_users(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value if user.role else None,
            "supporter_type": user.supporter_type,
            "business_name": user.business_name,
            "verification_status": user.verification_status,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            ),
        }
        for user in users
    ]


@router.post("/admin/users/{user_id}/verify")
async def admin_verify_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if target.role == UserRole.SUPPORTER and not target.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Cannot approve a supporter until their email is verified.",
        )

    target.verification_status = "verified"

    db.commit()
    db.refresh(target)

    return _serialize(target)


@router.post("/admin/users/{user_id}/reject")
async def admin_reject_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    target.verification_status = "rejected"

    db.commit()
    db.refresh(target)

    return _serialize(target)


@router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    target.verification_status = "suspended"

    db.commit()
    db.refresh(target)

    return _serialize(target)
