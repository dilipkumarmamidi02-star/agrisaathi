"""
users.py

Real, per-user profile endpoint backed by the `users` SQLite table and
Firebase ID token verification. Replaces the old file-backed demo stub
(demo_user.json is no longer used).
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None


def _get_or_create(db: Session, uid: str, email: Optional[str]) -> User:
    user = db.query(User).filter(User.uid == uid).first()
    if user is None:
        user = User(id=str(uuid.uuid4()), uid=uid, email=email)
        db.add(user)
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
