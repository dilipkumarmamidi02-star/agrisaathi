from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class QualityReport(Base):
    __tablename__ = "quality_reports"

    id = Column(String, primary_key=True)
    report_id = Column(String, index=True)

    session_id = Column(String, nullable=True)
    farmer_id = Column(String, index=True, nullable=True)
    farm_id = Column(String, nullable=True)
    lot_id = Column(String, nullable=True)

    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)

    sample_count = Column(Float, nullable=True)
    sample_ids = Column(JSON, nullable=True)

    ai_model = Column(String, nullable=True)
    ai_model_version = Column(String, nullable=True)

    overall_grade = Column(String, nullable=True)
    overall_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)

    quality_parameters = Column(JSON, nullable=True)

    mean_score = Column(Float, nullable=True)
    score_variance = Column(Float, nullable=True)
    outlier_samples = Column(JSON, nullable=True)
    consistency_note = Column(Text, nullable=True)

    report_hash = Column(String, nullable=True)
    blockchain_tx = Column(String, nullable=True)
    blockchain_status = Column(String, nullable=True)

    verification_status = Column(String, nullable=True)
    shared_with = Column(JSON, nullable=True)
    is_public = Column(Boolean, default=False)

    created_by = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)


class QualitySession(Base):
    __tablename__ = "quality_sessions"

    id = Column(String, primary_key=True)

    farmer_id = Column(String, index=True, nullable=True)
    farm_id = Column(String, nullable=True)
    crop_id = Column(String, nullable=True)

    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)

    sample_count = Column(Float, nullable=True)
    status = Column(String, nullable=True)

    ai_model = Column(String, nullable=True)
    ai_model_version = Column(String, nullable=True)

    overall_grade = Column(String, nullable=True)
    overall_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)

    quality_parameters = Column(JSON, nullable=True)
    analysis_timestamp = Column(DateTime, nullable=True)

    report_id = Column(String, nullable=True)
    created_by = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)


class QualitySample(Base):
    __tablename__ = "quality_samples"

    id = Column(String, primary_key=True)

    session_id = Column(String, index=True, nullable=True)
    farmer_id = Column(String, index=True, nullable=True)

    sample_number = Column(Float, nullable=True)

    file_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    capture_timestamp = Column(DateTime, nullable=True)

    validation_status = Column(String, nullable=True)
    validation_message = Column(Text, nullable=True)

    ai_result = Column(JSON, nullable=True)
    sample_score = Column(Float, nullable=True)
    is_outlier = Column(Boolean, default=False)

    created_by = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String, primary_key=True)
    ticket_id = Column(String, index=True)

    user_id = Column(String, index=True)
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    user_role = Column(String, nullable=True)

    portal_type = Column(String, nullable=True)

    subject = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    category = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    status = Column(String, default="open")

    related_lot_id = Column(String, nullable=True)
    related_order_id = Column(String, nullable=True)
    related_user_id = Column(String, nullable=True)

    attachments = Column(JSON, nullable=True)

    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)

    admin_notified = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)

    created_by = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    type = Column(String)
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Offer(Base):
    __tablename__ = "offers"
    id = Column(String, primary_key=True)
    lot_id = Column(String)
    buyer_id = Column(String)
    farmer_id = Column(String)
    quantity = Column(Float)
    price_per_unit = Column(Float)
    total_price = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True)
    order_id = Column(String)
    lot_id = Column(String)
    farmer_id = Column(String)
    buyer_id = Column(String)
    commodity = Column(String)
    quantity = Column(Float)
    gross_amount = Column(Float)
    net_amount = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class PriceAlert(Base):
    __tablename__ = "price_alerts"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    commodity = Column(String)
    target_price = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class StorageFacility(Base):
    __tablename__ = "storage_facilities"
    id = Column(String, primary_key=True)
    vendor_id = Column(String)
    facility_name = Column(String)
    facility_type = Column(String)
    state = Column(String)
    district = Column(String)
    total_capacity = Column(Float)
    verification_status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class LogisticsTrip(Base):
    __tablename__ = "logistics_trips"
    id = Column(String, primary_key=True)
    trip_id = Column(String)
    order_id = Column(String)
    farmer_id = Column(String)
    provider_id = Column(String)
    commodity = Column(String)
    quantity = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())


ENTITY_REGISTRY = {
    "QualityReport": QualityReport,
    "QualitySession": QualitySession,
    "QualitySample": QualitySample,
    "Grievance": Grievance,
    "Notification": Notification,
    "Offer": Offer,
    "Order": Order,
    "PriceAlert": PriceAlert,
    "StorageFacility": StorageFacility,
    "LogisticsTrip": LogisticsTrip,
    "AuditLog": AuditLog,
}
