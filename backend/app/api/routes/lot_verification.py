from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.lot import Lot

try:
    from app.models.base44_entities import QualityReport
except ImportError:
    QualityReport = None



def _farmer_profile_location(lot, farmer):
    """
    Authoritative lot destination:

    1. Explicit lot coordinates, when present.
    2. Farmer Profile coordinates, when lot coordinates are absent.
    3. Farmer Profile address fields as human-readable fallback.

    Buyer/supporter coordinates are NEVER used as the lot location.
    """
    lot_lat = getattr(lot, "latitude", None)
    lot_lng = getattr(lot, "longitude", None)

    farmer_lat = getattr(farmer, "latitude", None) if farmer else None
    farmer_lng = getattr(farmer, "longitude", None) if farmer else None

    latitude = lot_lat if lot_lat is not None else farmer_lat
    longitude = lot_lng if lot_lng is not None else farmer_lng

    parts = []
    if farmer:
        for field in ("address", "village", "district", "state"):
            value = getattr(farmer, field, None)
            if value:
                parts.append(str(value).strip())

    return {
        "latitude": latitude,
        "longitude": longitude,
        "address": ", ".join(dict.fromkeys(parts)) if parts else None,
        "source": (
            "lot"
            if lot_lat is not None and lot_lng is not None
            else "farmer_profile"
            if farmer_lat is not None and farmer_lng is not None
            else "farmer_profile_address"
            if parts
            else None
        ),
    }


router = APIRouter(
    prefix="/api/lot-verification",
    tags=["lot-verification"],
)


def _quality_report_dict(report) -> dict[str, Any] | None:
    if report is None:
        return None

    def value(name, default=None):
        return getattr(report, name, default)

    return {
        "report_id": value("report_id"),
        "commodity": value("commodity"),
        "variety": value("variety"),
        "sample_count": value("sample_count"),
        "ai_model": value("ai_model"),
        "ai_model_version": value("ai_model_version"),
        "overall_grade": value("overall_grade"),
        "overall_score": value("overall_score"),
        "confidence": value("confidence"),
        "quality_parameters": value("quality_parameters") or {},
        "mean_score": value("mean_score"),
        "score_variance": value("score_variance"),
        "outlier_samples": value("outlier_samples") or [],
        "consistency_note": value("consistency_note"),
        "report_hash": value("report_hash"),
        "blockchain_tx": value("blockchain_tx"),
        "blockchain_status": value("blockchain_status"),
        "verification_status": value("verification_status"),
    }



@router.get("/by-lot/{lot_id}")
def get_lot_qr_token_by_lot_id(lot_id: str):
    """
    Resolve an existing lot ID to its persisted QR token.

    This endpoint does NOT create a new token.
    It only returns the QR token already stored against the lot.
    """
    db: Session = SessionLocal()

    try:
        lot = (
            db.query(Lot)
            .filter(
                (Lot.lot_id == lot_id) |
                (Lot.id == lot_id)
            )
            .first()
        )

        if not lot:
            raise HTTPException(
                status_code=404,
                detail="Lot not found.",
            )

        if lot.status in {"cancelled", "deleted", "rejected", "pending_review"}:
            raise HTTPException(
                status_code=410,
                detail="This lot is no longer available.",
            )

        if not lot.qr_token:
            raise HTTPException(
                status_code=404,
                detail="This lot does not have a QR token.",
            )

        return {
            "lot_id": lot.lot_id,
            "qr_token": lot.qr_token,
            "verification_url_path": (
                f"/lot-verification/{lot.qr_token}"
            ),
        }

    finally:
        db.close()


@router.get("/{qr_token}")
def verify_lot(qr_token: str):
    db: Session = SessionLocal()

    try:
        lot = (
            db.query(Lot)
            .filter(Lot.qr_token == qr_token)
            .first()
        )

        if lot is None:
            raise HTTPException(
                status_code=404,
                detail="Lot QR code is invalid or the lot no longer exists.",
            )

        if lot.status in {"cancelled", "deleted", "rejected", "pending_review"}:
            raise HTTPException(
                status_code=410,
                detail="This lot is no longer available for verification.",
            )

        report = None

        if QualityReport is not None and lot.quality_report_id:
            report = (
                db.query(QualityReport)
                .filter(
                    QualityReport.report_id == lot.quality_report_id
                )
                .first()
            )

        return {
            "verified": True,
            "verification_type": "AGRISAATHI_LOT_QR",

            "lot": {
            "qr_token": lot.qr_token,
                "lot_id": lot.lot_id,
                "crop": lot.crop,
                "variety": lot.variety,
                "quantity_quintal": lot.quantity_quintal,
                "price_per_quintal": lot.price_per_quintal,
                "min_price_per_quintal": lot.min_price_per_quintal,
                "harvest_date": lot.harvest_date,
                "notes": lot.notes,
                "status": lot.status,
                "farmer_name": lot.farmer_name,
                "farmer_phone": lot.farmer_phone,
                "farmer_email": lot.farmer_email,
                "latitude": location_data["latitude"],
                "longitude": location_data["longitude"],
                "location_address": location_data["address"],
                "location_source": location_data["source"],
                # True when this lot skipped the Quality Checker and is
                # sitting in "pending_review" for an admin to manually
                # confirm the farmer-supplied details before it goes live.
                "needs_admin_review": lot.status == "pending_review",

                "quality_grade": lot.quality_grade,
                "quality_score": lot.quality_score,
                "quality_report_id": lot.quality_report_id,

                "blockchain_hash": lot.blockchain_hash,
                "blockchain_status": lot.blockchain_status,
            },

            "quality_report": _quality_report_dict(report),

            "integrity": {
                "lot_hash_present": bool(lot.blockchain_hash),
                "report_found": report is not None,
                "report_hash_present": bool(
                    report and getattr(report, "report_hash", None)
                ),
                "verification_status": (
                    getattr(report, "verification_status", None)
                    if report
                    else None
                ),
            },
        }

    finally:
        db.close()
