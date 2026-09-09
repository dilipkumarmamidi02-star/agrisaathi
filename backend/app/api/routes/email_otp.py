import hashlib
import secrets
import smtplib
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.email_otp import EmailOTP
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/auth/email", tags=["email-verification"])


class OTPVerify(BaseModel):
    code: str


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_otp(uid: str, code: str) -> str:
    raw = f"{uid}:{code}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _send_email(to_email: str, code: str):
    if not settings.smtp_host:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Set SMTP settings in backend/.env.",
        )

    from_email = settings.smtp_from_email or settings.smtp_username

    message = EmailMessage()
    message["Subject"] = "AgriSaathi email verification code"
    message["From"] = f"{settings.smtp_from_name} <{from_email}>"
    message["To"] = to_email

    message.set_content(
        f"""Hello,

Your AgriSaathi email verification code is:

{code}

This code expires in {settings.otp_expire_minutes} minutes.

If you did not create an AgriSaathi account, you can ignore this email.

AgriSaathi
"""
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not send verification email: {exc}",
        )


@router.post("/send-otp")
async def send_otp(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    uid = current_user["uid"]
    email = (current_user.get("email") or "").strip().lower()

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Your Firebase account does not contain an email address.",
        )

    user = db.query(User).filter(User.uid == uid).first()

    if user is None:
        user = User(
            id=str(uuid.uuid4()),
            uid=uid,
            email=email,
            role=UserRole.FARMER,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.is_verified:
        return {
            "ok": True,
            "already_verified": True,
            "message": "Email is already verified.",
        }

    latest = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.uid == uid,
            EmailOTP.used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if latest and latest.created_at:
        created = latest.created_at
        if created.tzinfo:
            created = created.replace(tzinfo=None)

        elapsed = (_utcnow() - created).total_seconds()

        if elapsed < settings.otp_resend_seconds:
            remaining = max(
                1,
                int(settings.otp_resend_seconds - elapsed),
            )
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Please wait before requesting another code.",
                    "retry_after": remaining,
                },
            )

    # Invalidate previous codes.
    db.query(EmailOTP).filter(
        EmailOTP.uid == uid,
        EmailOTP.used == False,
    ).update({"used": True})

    code = f"{secrets.randbelow(1000000):06d}"

    otp = EmailOTP(
        id=str(uuid.uuid4()),
        uid=uid,
        email=email,
        otp_hash=_hash_otp(uid, code),
        expires_at=_utcnow() + timedelta(
            minutes=settings.otp_expire_minutes
        ),
        attempts=0,
        used=False,
    )

    db.add(otp)
    db.commit()

    try:
        _send_email(email, code)
    except Exception:
        otp.used = True
        db.commit()
        raise

    return {
        "ok": True,
        "message": "Verification code sent.",
        "expires_in_minutes": settings.otp_expire_minutes,
    }


@router.post("/verify-otp")
async def verify_otp(
    payload: OTPVerify,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    uid = current_user["uid"]
    code = payload.code.strip()

    if not code.isdigit() or len(code) != 6:
        raise HTTPException(
            status_code=400,
            detail="Enter the 6-digit verification code.",
        )

    otp = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.uid == uid,
            EmailOTP.used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(
            status_code=400,
            detail="No active verification code. Request a new code.",
        )

    if _utcnow() > otp.expires_at:
        otp.used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="This verification code has expired. Request a new code.",
        )

    if otp.attempts >= settings.otp_max_attempts:
        otp.used = True
        db.commit()
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Request a new code.",
        )

    if not secrets.compare_digest(
        otp.otp_hash,
        _hash_otp(uid, code),
    ):
        otp.attempts += 1

        if otp.attempts >= settings.otp_max_attempts:
            otp.used = True

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Incorrect verification code.",
        )

    otp.used = True

    user = db.query(User).filter(User.uid == uid).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="AgriSaathi user profile not found.",
        )

    user.is_verified = True
    user.email_verified_at = _utcnow()

    # Supporters remain pending until an admin approves them.
    if user.role == UserRole.SUPPORTER:
        if user.verification_status not in {"verified", "suspended", "rejected"}:
            user.verification_status = "pending"
    else:
        user.verification_status = "verified"

    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "email_verified": True,
        "verification_status": user.verification_status,
        "role": user.role.value if user.role else None,
        "message": (
            "Email verified. Your supporter application is now pending "
            "administrator approval."
            if user.role == UserRole.SUPPORTER
            else "Email verified. Your AgriSaathi account is active."
        ),
    }
