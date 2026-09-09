"""
Adds the 19 non-conflicting Base44-export entities to this project,
extends Farm / Lot / CropBatch additively (new nullable columns only,
nothing removed or renamed), and wires a generic /api/entities/{Name}
CRUD router using this project's existing Firebase auth.

Deliberately NOT ported: Base44's User, security.py, auth.py — this
project uses Firebase for identity/hashing/OTP, so importing a second
password-based user system would create two competing sources of truth
for "who is logged in."

Deliberately merged, not duplicated: Base44's "Crop" (a planting record:
crop_name, planting_date, expected_harvest_date, estimated_quantity) is
the same concept as this project's existing CropBatch, not its existing
Crop (a reference/catalog entry like "Rice: needs X water"). Its fields
are added to CropBatch instead of creating a second table with the same
meaning under a colliding name.

Run from the project root (must contain backend/app/main.py).
"""
import os
import re
import sqlite3

BACKEND = "backend"
APP = os.path.join(BACKEND, "app")

assert os.path.exists(os.path.join(APP, "main.py")), (
    "Run this from the project root (the folder containing backend/app/main.py)"
)

# ============================================================
# 1. New standalone entities (19) — faithful port of Base44's
#    models.py fields, using this project's existing conventions
#    (id = Column(String, primary_key=True), func.now() timestamps).
# ============================================================

NEW_ENTITIES_FILE = os.path.join(APP, "models", "base44_entities.py")

NEW_ENTITIES_CODE = '''"""
Entities ported from the Base44 export (agrisaathi-fastapi.zip).
Generic CRUD for all of these is served by app/api/routes/entities.py.

Not ported here: User (this project uses Firebase for auth — see
app/core/firebase_auth.py). Every farmer_id / buyer_id / created_by
column below is a plain string holding the Firebase UID, matching the
existing Lot.farmer_id convention already used in app/models/lot.py.
"""
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    user_role = Column(String, nullable=True)
    action = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class BulkPickupSchedule(Base):
    __tablename__ = "bulk_pickup_schedules"
    id = Column(String, primary_key=True)
    provider_id = Column(String, nullable=True)
    schedule_name = Column(String, nullable=True)
    planned_date = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    total_capacity = Column(Float, nullable=True)
    capacity_unit = Column(String, nullable=True)
    order_ids = Column(JSON, nullable=True)
    pickup_stops = Column(JSON, nullable=True)
    total_distance_km = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class BuyerDemand(Base):
    __tablename__ = "buyer_demands"
    id = Column(String, primary_key=True)
    buyer_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    required_grade = Column(String, nullable=True)
    min_quality_score = Column(Float, nullable=True)
    quantity_required = Column(Float, nullable=True)
    quantity_unit = Column(String, nullable=True)
    price_offered = Column(Float, nullable=True)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    delivery_preference = Column(String, nullable=True)
    payment_terms = Column(String, nullable=True)
    required_by_date = Column(String, nullable=True)
    status = Column(String, nullable=True)
    special_requirements = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    diagnosis_type = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    image_urls = Column(JSON, nullable=True)
    findings = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    severity = Column(String, nullable=True)
    recommendations = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(String, primary_key=True)
    ticket_id = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    user_role = Column(String, nullable=True)
    portal_type = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    status = Column(String, nullable=True)
    related_lot_id = Column(String, nullable=True)
    related_order_id = Column(String, nullable=True)
    related_user_id = Column(String, nullable=True)
    attachments = Column(JSON, nullable=True)
    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)
    admin_notified = Column(Boolean, nullable=True)
    email_sent = Column(Boolean, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class HarvestForecast(Base):
    __tablename__ = "harvest_forecasts"
    id = Column(String, primary_key=True)
    farmer_id = Column(String, nullable=True)
    farm_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    expected_quantity = Column(Float, nullable=True)
    quantity_unit = Column(String, nullable=True)
    expected_harvest_date = Column(String, nullable=True)
    season = Column(String, nullable=True)
    confidence_level = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class LogisticsProvider(Base):
    __tablename__ = "logistics_providers"
    id = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    vehicle_types = Column(JSON, nullable=True)
    vehicle_count = Column(Float, nullable=True)
    total_capacity = Column(Float, nullable=True)
    has_temperature_control = Column(Boolean, nullable=True)
    service_regions = Column(JSON, nullable=True)
    pricing_method = Column(String, nullable=True)
    base_rate = Column(Float, nullable=True)
    rate_per_km = Column(Float, nullable=True)
    verification_status = Column(String, nullable=True)
    documents = Column(JSON, nullable=True)
    is_available = Column(Boolean, nullable=True)
    rating = Column(Float, nullable=True)
    completed_trips = Column(Float, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class LogisticsTrip(Base):
    __tablename__ = "logistics_trips"
    id = Column(String, primary_key=True)
    trip_id = Column(String, nullable=True)
    order_id = Column(String, nullable=True)
    farmer_id = Column(String, nullable=True)
    buyer_id = Column(String, nullable=True)
    provider_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    pickup_address = Column(Text, nullable=True)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    delivery_address = Column(Text, nullable=True)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    vehicle_type = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    last_location_update = Column(String, nullable=True)
    tracking_enabled = Column(Boolean, nullable=True)
    pickup_time = Column(String, nullable=True)
    delivery_time = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class MandiPrice(Base):
    __tablename__ = "mandi_prices_ext"
    id = Column(String, primary_key=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    market = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    arrival_date = Column(String, nullable=True)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    modal_price = Column(Float, nullable=True)
    price_unit = Column(String, nullable=True)
    source = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    retrieval_timestamp = Column(String, nullable=True)
    source_date = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    type = Column(String, nullable=True)
    title = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    source_record_type = Column(String, nullable=True)
    source_record_id = Column(String, nullable=True)
    is_read = Column(Boolean, nullable=True)
    delivery_status = Column(String, nullable=True)
    sent_at = Column(String, nullable=True)
    action_url = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Offer(Base):
    __tablename__ = "offers"
    id = Column(String, primary_key=True)
    lot_id = Column(String, nullable=True)
    buyer_id = Column(String, nullable=True)
    farmer_id = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    quantity_unit = Column(String, nullable=True)
    price_per_unit = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)
    pickup_or_delivery = Column(String, nullable=True)
    payment_terms = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    conditions = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    counter_price = Column(Float, nullable=True)
    counter_notes = Column(Text, nullable=True)
    farmer_notes = Column(Text, nullable=True)
    buyer_notes = Column(Text, nullable=True)
    negotiation_history = Column(JSON, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True)
    order_id = Column(String, nullable=True)
    lot_id = Column(String, nullable=True)
    offer_id = Column(String, nullable=True)
    farmer_id = Column(String, nullable=True)
    buyer_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    quantity_unit = Column(String, nullable=True)
    price_per_unit = Column(Float, nullable=True)
    gross_amount = Column(Float, nullable=True)
    transport_cost = Column(Float, nullable=True)
    storage_cost = Column(Float, nullable=True)
    other_costs = Column(Float, nullable=True)
    net_amount = Column(Float, nullable=True)
    delivery_address = Column(Text, nullable=True)
    payment_terms = Column(String, nullable=True)
    status = Column(String, nullable=True)
    logistics_trip_id = Column(String, nullable=True)
    payment_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class PriceAlert(Base):
    __tablename__ = "price_alerts_ext"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    market = Column(String, nullable=True)
    target_price = Column(Float, nullable=True)
    price_direction = Column(String, nullable=True)
    notification_channels = Column(JSON, nullable=True)
    frequency = Column(String, nullable=True)
    status = Column(String, nullable=True)
    last_triggered_at = Column(String, nullable=True)
    last_triggered_price = Column(Float, nullable=True)
    trigger_count = Column(Float, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class QualityReport(Base):
    __tablename__ = "quality_reports"
    id = Column(String, primary_key=True)
    report_id = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    farmer_id = Column(String, nullable=True)
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
    is_public = Column(Boolean, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class QualitySample(Base):
    __tablename__ = "quality_samples"
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=True)
    farmer_id = Column(String, nullable=True)
    sample_number = Column(Float, nullable=True)
    file_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    capture_timestamp = Column(String, nullable=True)
    validation_status = Column(String, nullable=True)
    validation_message = Column(Text, nullable=True)
    ai_result = Column(JSON, nullable=True)
    sample_score = Column(Float, nullable=True)
    is_outlier = Column(Boolean, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class QualitySession(Base):
    __tablename__ = "quality_sessions"
    id = Column(String, primary_key=True)
    farmer_id = Column(String, nullable=True)
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
    analysis_timestamp = Column(String, nullable=True)
    report_id = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class StorageBooking(Base):
    __tablename__ = "storage_bookings"
    id = Column(String, primary_key=True)
    farmer_id = Column(String, nullable=True)
    facility_id = Column(String, nullable=True)
    vendor_id = Column(String, nullable=True)
    lot_id = Column(String, nullable=True)
    commodity = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    quantity_unit = Column(String, nullable=True)
    required_temperature = Column(Float, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    special_requirements = Column(Text, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    vendor_notes = Column(Text, nullable=True)
    farmer_notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class StorageFacility(Base):
    __tablename__ = "storage_facilities"
    id = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=True)
    facility_name = Column(String, nullable=True)
    facility_type = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    total_capacity = Column(Float, nullable=True)
    available_capacity = Column(Float, nullable=True)
    capacity_unit = Column(String, nullable=True)
    commodity_compatibility = Column(JSON, nullable=True)
    min_temperature = Column(Float, nullable=True)
    max_temperature = Column(Float, nullable=True)
    price_per_unit = Column(Float, nullable=True)
    price_unit = Column(String, nullable=True)
    min_duration_days = Column(Float, nullable=True)
    max_duration_days = Column(Float, nullable=True)
    facilities = Column(JSON, nullable=True)
    has_power_backup = Column(Boolean, nullable=True)
    operating_hours = Column(String, nullable=True)
    photos = Column(JSON, nullable=True)
    documents = Column(JSON, nullable=True)
    verification_status = Column(String, nullable=True)
    permission_number = Column(String, nullable=True)
    permission_expiry = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    is_published = Column(Boolean, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class UserProfile(Base):
    """
    Extension table keyed to the Firebase UID (user_id) — NOT a second
    login system. Firebase remains the sole source of truth for identity;
    this just holds role/portal_type/KYC/business fields Firebase doesn't
    store natively.
    """
    __tablename__ = "user_profiles"
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=False)  # Firebase UID
    role = Column(String, nullable=True)  # farmer | buyer | vendor | admin | supporter
    portal_type = Column(String, nullable=True)  # farmer | supporter
    full_name = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    mandal = Column(String, nullable=True)
    village = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    kyc_status = Column(String, nullable=True)
    verification_status = Column(String, nullable=True)
    profile_completion = Column(Float, nullable=True)
    avatar_url = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, nullable=True)
    push_token = Column(String, nullable=True)
    notification_preferences = Column(JSON, nullable=True)
    gender = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


ENTITY_REGISTRY = {
    "AuditLog": AuditLog,
    "BulkPickupSchedule": BulkPickupSchedule,
    "BuyerDemand": BuyerDemand,
    "Diagnosis": Diagnosis,
    "Grievance": Grievance,
    "HarvestForecast": HarvestForecast,
    "LogisticsProvider": LogisticsProvider,
    "LogisticsTrip": LogisticsTrip,
    "MandiPriceExt": MandiPrice,
    "Notification": Notification,
    "Offer": Offer,
    "Order": Order,
    "PriceAlertExt": PriceAlert,
    "QualityReport": QualityReport,
    "QualitySample": QualitySample,
    "QualitySession": QualitySession,
    "StorageBooking": StorageBooking,
    "StorageFacility": StorageFacility,
    "UserProfile": UserProfile,
}
'''

os.makedirs(os.path.dirname(NEW_ENTITIES_FILE), exist_ok=True)
with open(NEW_ENTITIES_FILE, "w") as f:
    f.write(NEW_ENTITIES_CODE)
print(f"created {NEW_ENTITIES_FILE} (19 entities)")

# ============================================================
# 2. Generic /api/entities/{Name} CRUD router
# ============================================================

ROUTER_FILE = os.path.join(APP, "api", "routes", "base44_entities_router.py")

ROUTER_CODE = '''"""
Generic CRUD for the 19 Base44-ported entities, mirroring the pattern
in the original Base44 export's routers/entities.py (list/filter/get/
create/update/delete at /api/entities/{EntityName}), but using this
project's existing Firebase auth instead of a separate JWT system.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import ENTITY_REGISTRY

router = APIRouter(prefix="/api/entities", tags=["entities"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _model_for(entity_name: str):
    model = ENTITY_REGISTRY.get(entity_name)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown entity '{entity_name}'. Registered: {list(ENTITY_REGISTRY.keys())}",
        )
    return model


def _row_to_dict(row):
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


@router.get("/{entity_name}")
def list_entities(
    entity_name: str,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    rows = db.query(model).offset(offset).limit(limit).all()
    return [_row_to_dict(r) for r in rows]


@router.get("/{entity_name}/{item_id}")
def get_entity(
    entity_name: str,
    item_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    return _row_to_dict(row)


@router.post("/{entity_name}")
def create_entity(
    entity_name: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    valid_columns = {c.name for c in model.__table__.columns}
    data = {k: v for k, v in payload.items() if k in valid_columns}
    data["id"] = data.get("id") or str(uuid.uuid4())
    data["created_by"] = user.get("uid")
    row = model(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.put("/{entity_name}/{item_id}")
def update_entity(
    entity_name: str,
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    valid_columns = {c.name for c in model.__table__.columns}
    for k, v in payload.items():
        if k in valid_columns and k not in ("id", "created_by", "created_at"):
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.delete("/{entity_name}/{item_id}")
def delete_entity(
    entity_name: str,
    item_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    db.delete(row)
    db.commit()
    return {"success": True, "id": item_id}
'''

os.makedirs(os.path.dirname(ROUTER_FILE), exist_ok=True)
with open(ROUTER_FILE, "w") as f:
    f.write(ROUTER_CODE)
print(f"created {ROUTER_FILE}")

# ============================================================
# 3. Register the router in main.py (additive — does not touch
#    any existing router registration)
# ============================================================

MAIN_PY = os.path.join(APP, "main.py")
with open(MAIN_PY) as f:
    main_content = f.read()

if "base44_entities_router" not in main_content:
    import_line = "from app.core.firebase_auth import get_current_user"
    new_import = (
        import_line
        + "\nfrom app.api.routes import base44_entities_router"
    )
    assert import_line in main_content, "expected import line not found in main.py"
    main_content = main_content.replace(import_line, new_import, 1)

    anchor = "_auth_dep = [Depends(get_current_user)]"
    assert anchor in main_content, "expected _auth_dep line not found in main.py"
    main_content = main_content.replace(
        anchor,
        anchor + "\n\napp.include_router(base44_entities_router.router, dependencies=_auth_dep)",
        1,
    )

    with open(MAIN_PY, "w") as f:
        f.write(main_content)
    print("main.py: base44_entities_router registered")
else:
    print("main.py: base44_entities_router already registered, skipped")

print("\nStandalone entities: done. Run migrate_base44_columns.py next for Farm/Lot/CropBatch.")
