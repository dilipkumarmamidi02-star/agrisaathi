import smtplib
from email.message import EmailMessage
from typing import Optional, List

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str, cc: Optional[List[str]] = None) -> bool:
    if not to_email:
        return False
    if not settings.smtp_host:
        print(f"[email_service] SMTP not configured — skipped '{subject}' to {to_email}")
        return False

    from_email = settings.smtp_from_email or settings.smtp_username
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{from_email}>"
    message["To"] = to_email
    if cc:
        message["Cc"] = ", ".join(cc)
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(
                message,
                to_addrs=[to_email] + (cc or [])
            )
        return True
    except Exception as exc:
        print(f"[email_service] send failed to {to_email}: {exc}")
        return False
