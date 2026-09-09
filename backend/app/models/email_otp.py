from sqlalchemy import Column, String, DateTime, Integer, Boolean
from sqlalchemy.sql import func

from app.core.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(String, primary_key=True)
    uid = Column(String, index=True, nullable=False)
    email = Column(String, index=True, nullable=False)

    # Store only the hash, never the actual OTP.
    otp_hash = Column(String, nullable=False)

    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    attempts = Column(Integer, default=0)
    used = Column(Boolean, default=False)
