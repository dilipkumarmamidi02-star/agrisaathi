from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import Grievance
from app.models.user import User, UserRole


router = APIRouter(
    prefix="/api/grievances",
    tags=["Grievances"],
)


def _require_admin(
    current_user: dict,
    db: Session,
) -> User:
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


def _serialize_grievance(item: Grievance) -> dict[str, Any]:
    return {
        "id": item.id,
        "grievance_id": item.ticket_id or item.id,
        "ticket_id": item.ticket_id,

        "user_id": item.user_id,
        "user_name": item.user_name,
        "user_email": item.user_email,
        "user_role": item.user_role,

        "portal_type": item.portal_type,

        "subject": item.subject,
        "description": item.description,

        "category": item.category,
        "priority": item.priority,
        "status": item.status or "open",

        "related_lot_id": item.related_lot_id,
        "related_order_id": item.related_order_id,
        "related_user_id": item.related_user_id,

        "attachments": item.attachments,

        "admin_notes": item.admin_notes,
        "resolved_by": item.resolved_by,
        "resolved_at": item.resolved_at,

        "admin_notified": bool(item.admin_notified),
        "email_sent": bool(item.email_sent),

        "created_by": item.created_by,

        "created_at": (
            item.created_at.isoformat()
            if item.created_at
            else None
        ),
        "updated_at": (
            item.updated_at.isoformat()
            if item.updated_at
            else None
        ),
    }


@router.get("")
@router.get("/")
async def get_grievances(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user, db)

    grievances = (
        db.query(Grievance)
        .order_by(Grievance.created_at.desc())
        .all()
    )

    return {
        "grievances": [
            _serialize_grievance(item)
            for item in grievances
        ],
        "total": len(grievances),
    }
