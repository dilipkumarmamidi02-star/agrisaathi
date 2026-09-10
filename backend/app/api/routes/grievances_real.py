from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import Grievance
from app.models.user import User

router = APIRouter(
    prefix="/api/grievances",
    tags=["Grievances"],
)


def serialize(g):
    return {
        "id": g.id,
        "ticket_id": g.ticket_id,
        "user_id": g.user_id,
        "user_name": g.user_name,
        "user_email": g.user_email,
        "user_role": g.user_role,
        "portal_type": g.portal_type,
        "subject": g.subject,
        "description": g.description,
        "category": g.category,
        "priority": g.priority,
        "status": g.status,
        "related_lot_id": g.related_lot_id,
        "related_order_id": g.related_order_id,
        "admin_notes": g.admin_notes,
        "admin_notified": bool(g.admin_notified),
        "email_sent": bool(g.email_sent),
        "created_at": (
            g.created_at.isoformat()
            if g.created_at else None
        ),
        "updated_at": (
            g.updated_at.isoformat()
            if g.updated_at else None
        ),
    }


@router.get("")
@router.get("/")
def my_grievances(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.get("uid")

    rows = (
        db.query(Grievance)
        .filter(Grievance.user_id == uid)
        .order_by(Grievance.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(rows),
        "grievances": [serialize(g) for g in rows],
    }


@router.post("")
@router.post("/")
def create_grievance(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.get("uid")

    subject = str(payload.get("subject") or "").strip()
    description = str(payload.get("description") or "").strip()

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Subject is required.",
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Description is required.",
        )

    user = (
        db.query(User)
        .filter(User.uid == uid)
        .first()
    )

    ticket_id = (
        "GRV-"
        + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        + "-"
        + uuid.uuid4().hex[:6].upper()
    )

    grievance = Grievance(
        id=str(uuid.uuid4()),
        ticket_id=ticket_id,
        user_id=uid,
        user_name=(
            user.full_name
            if user and user.full_name
            else current_user.get("name")
        ),
        user_email=(
            user.email
            if user and user.email
            else current_user.get("email")
        ),
        user_role=(
            user.role.value
            if user and hasattr(user.role, "value")
            else str(user.role)
            if user else None
        ),
        portal_type=(
            "supporter"
            if user and str(user.role).lower().endswith("supporter")
            else "farmer"
        ),
        subject=subject,
        description=description,
        category=payload.get("category") or "other",
        priority=payload.get("priority") or "medium",
        status="open",
        related_lot_id=payload.get("related_lot_id"),
        related_order_id=payload.get("related_order_id"),
        related_user_id=payload.get("related_user_id"),
        attachments=payload.get("attachments") or [],
        admin_notified=False,
        email_sent=False,
        created_by=uid,
    )

    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    return {
        "success": True,
        "grievance": serialize(grievance),
    }
