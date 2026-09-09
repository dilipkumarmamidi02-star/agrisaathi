from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Lot(Base):
    __tablename__ = "lots"

    id = Column(String, primary_key=True)
    lot_id = Column(String, nullable=True, unique=True)

    farmer_id = Column(String, index=True, nullable=False)
    farmer_name = Column(String, nullable=True)
    farmer_phone = Column(String, nullable=True)
    farmer_email = Column(String, nullable=True)

    # Lot pickup location, captured from the browser at creation time.
    # Used for the Haversine distance calc against buyer/logistics/
    # cold-storage locations in Phase 3.
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farmer_phone = Column(String, nullable=True)
    farmer_email = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    crop = Column(String, nullable=False)
    variety = Column(String, nullable=True)

    quantity_quintal = Column(Float, nullable=False)
    price_per_quintal = Column(Float, nullable=False)
    min_price_per_quintal = Column(Float, nullable=True)

    harvest_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    status = Column(String, default="active")

    qr_token = Column(String, nullable=True, unique=True)

    blockchain_hash = Column(String, nullable=True)
    blockchain_status = Column(String, default="pending")

    quality_report_id = Column(String, nullable=True)
    quality_grade = Column(String, nullable=True)
    quality_score = Column(Float, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
