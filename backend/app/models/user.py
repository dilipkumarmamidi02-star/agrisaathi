from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text, Float
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    SUPPORTER = "supporter"
    ADMIN = "admin"


# The supporter categories recognised by AgriSaathi.
# Stored as a normal string column so additional categories
# can be introduced later without changing the database enum.
SUPPORTER_TYPES = [
    "fpo_farmer_group",
    "buyer",
    "trader",
    "processor",
    "institutional_buyer",
    "logistics_provider",
    "warehouse_provider",
    "cold_storage_provider",
    "quality_service_provider",
    "private_market_operator",
    "government_market_operator",
]

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    preferred_language = Column(String, default="en")
    # Email ownership verification.
    # This is deliberately separate from supporter admin verification.
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)

    # Supporter account information
    supporter_type = Column(String, nullable=True)
    business_name = Column(String, nullable=True)

    # pending | verified | rejected | suspended
    # Mainly meaningful for supporter accounts.
    verification_status = Column(String, default="verified")
    profile_picture = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
