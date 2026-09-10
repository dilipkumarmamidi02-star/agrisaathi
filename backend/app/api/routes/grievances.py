from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

from app.models.base44_entities import Grievance, Notification
from app.core.config import settings
from app.services.email_service import send_email
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



@router.get("/mine")
async def get_my_grievances(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return grievances belonging to the authenticated user.

    The database stores the application's internal User.id in
    Grievance.user_id, so this endpoint resolves Firebase UID -> User.id
    before filtering.
    """
    user = (
        db.query(User)
        .filter(User.uid == current_user["uid"])
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found.",
        )

    grievances = (
        db.query(Grievance)
        .filter(Grievance.user_id == user.id)
        .order_by(Grievance.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(grievances),
        "grievances": [
            _serialize_grievance(item)
            for item in grievances
        ],
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

class GrievanceCreate(BaseModel):
    subject: str
    description: str = ""
    category: str | None = None
    priority: str | None = "normal"
    related_lot_id: str | None = None
    related_order_id: str | None = None


class GrievanceResolve(BaseModel):
    status: str
    admin_notes: str = ""


@router.post("")
@router.post("/")
async def create_grievance(
    payload: GrievanceCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.uid == current_user["uid"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Call /api/users/me first.",
        )

    ticket_id = f"GRV-{str(uuid.uuid4())[:8].upper()}"

    grievance = Grievance(
        id=str(uuid.uuid4()),
        ticket_id=ticket_id,
        user_id=user.id,
        user_name=user.full_name,
        user_email=user.email,
        user_role=user.role.value if user.role else None,
        subject=payload.subject,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        status="open",
        related_lot_id=payload.related_lot_id,
        related_order_id=payload.related_order_id,
        created_by=user.id,
    )

    db.add(grievance)

    for admin in db.query(User).filter(
        User.role == UserRole.ADMIN
    ).all():
        db.add(
            Notification(
                id=str(uuid.uuid4()),
                user_id=admin.id,
                type="grievance_raised",
                title=f"New grievance {ticket_id}",
                message=payload.subject,
            )
        )

    admin_notified = False
    email_ok = False

    body = (
        f"Ticket: {ticket_id}\n"
        f"From: {user.full_name or 'N/A'} "
        f"({user.role.value if user.role else 'N/A'})\n"
        f"Phone: {user.phone or 'N/A'}\n"
        f"Email: {user.email or 'N/A'}\n\n"
        f"Subject: {payload.subject}\n\n"
        f"{payload.description}\n\n"
        f"Support: {settings.support_email}"
    )

    if settings.admin_email:
        email_ok = send_email(
            to_email=settings.admin_email,
            cc=[settings.support_email],
            subject=f"[AgriSaathi] New grievance {ticket_id}: {payload.subject}",
            body=body,
        )
        admin_notified = email_ok
    else:
        email_ok = send_email(
            to_email=settings.support_email,
            subject=f"[AgriSaathi] New grievance {ticket_id}: {payload.subject}",
            body=body,
        )

    grievance.admin_notified = admin_notified
    grievance.email_sent = email_ok

    db.commit()
    db.refresh(grievance)

    return {
        "ticket_id": ticket_id,
        "grievance_id": grievance.id,
        "status": grievance.status,
    }


@router.patch("/{grievance_id}/resolve")
async def resolve_grievance(
    grievance_id: str,
    payload: GrievanceResolve,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin = _require_admin(current_user, db)

    if payload.status not in {
        "resolved",
        "rejected",
        "in_progress",
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid grievance status",
        )

    grievance = db.query(Grievance).filter(
        Grievance.id == grievance_id
    ).first()

    if not grievance:
        raise HTTPException(
            status_code=404,
            detail="Grievance not found",
        )

    grievance.status = payload.status
    grievance.admin_notes = payload.admin_notes
    grievance.resolved_by = admin.id
    grievance.resolved_at = datetime.now(timezone.utc).isoformat()

    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=grievance.user_id,
            type="grievance_update",
            title=f"Update on {grievance.ticket_id}: {payload.status}",
            message=(
                payload.admin_notes
                or f"Your ticket status is now {payload.status}."
            ),
        )
    )

    db.commit()

    if grievance.user_email:
        send_email(
            to_email=grievance.user_email,
            cc=[settings.support_email],
            subject=(
                f"[AgriSaathi] Update on ticket "
                f"{grievance.ticket_id}: {payload.status}"
            ),
            body=(
                f'Your grievance "{grievance.subject}" has been updated.\n\n'
                f"Status: {payload.status}\n"
                f"Admin notes: {payload.admin_notes or '(none)'}\n\n"
                f"Support: {settings.support_email}"
            ),
        )

    return {
        "ticket_id": grievance.ticket_id,
        "status": grievance.status,
    }
