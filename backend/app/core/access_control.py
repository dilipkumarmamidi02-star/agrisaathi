"""
access_control.py

Gate for supporter-type accounts (buyer, trader, logistics_provider,
warehouse_provider, cold_storage_provider, quality_service_provider,
private_market_operator, government_market_operator, fpo_farmer_group,
institutional_buyer).

Farmers and admins always pass. A supporter only passes once
verification_status == "verified" (set by an admin via
/api/users/admin/users/{id}/verify).

Use this in place of get_current_user on any route a supporter should
NOT be able to touch until approved: lots, mandi prices, logistics,
cold storage, warehouse, offers.

Do NOT use this on /api/users/me, /api/users/register-supporter, or
any admin route — those must stay reachable pre-verification (a
supporter needs /me to see their own pending status, and register-
supporter is how they become one).
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.user import User, UserRole


async def get_verified_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.uid == current_user["uid"]).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Call /api/users/me first.",
        )

    if user.role in (UserRole.FARMER, UserRole.ADMIN):
        return user

    if user.verification_status != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": (
                    "Your supporter account is awaiting admin "
                    "verification. You'll get access to lots, "
                    "logistics, cold storage, warehouse listings "
                    "and market prices once approved."
                ),
                "verification_status": user.verification_status,
            },
        )

    return user
