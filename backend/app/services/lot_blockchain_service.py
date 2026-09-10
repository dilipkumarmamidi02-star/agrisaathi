"""
AgriSaathi Lot Blockchain Service

Application policy:

1. Quality Checker lots:
   - quality_report_id must exist
   - hash the canonical lot + quality information
   - anchor the hash on AgriSaathiRegistry
   - only mark verified after a successful blockchain receipt
   - read the record back and compare the hash

2. Manually created lots:
   - remain pending
   - are NOT automatically anchored
   - require explicit admin approval before anchoring

This module never fabricates blockchain transactions.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import text

from app.blockchain import (
    anchor_hash,
    calculate_record_hash,
    verify_hash,
)


def _canonical_lot_record(lot: Any) -> dict:
    """
    Build deterministic data representing the lot and its
    verification-relevant fields.
    """

    return {
        "lot_id": getattr(lot, "lot_id", None)
        or getattr(lot, "id", None),
        "crop": getattr(lot, "crop", None),
        "variety": getattr(lot, "variety", None),
        "quantity_quintal": getattr(lot, "quantity_quintal", None),
        "price_per_quintal": getattr(lot, "price_per_quintal", None),
        "min_price_per_quintal": getattr(
            lot,
            "min_price_per_quintal",
            None,
        ),
        "farmer_id": getattr(lot, "farmer_id", None),
        "farmer_name": getattr(lot, "farmer_name", None),
        "farmer_phone": getattr(lot, "farmer_phone", None),
        "farmer_email": getattr(lot, "farmer_email", None),
        "latitude": getattr(lot, "latitude", None),
        "longitude": getattr(lot, "longitude", None),
        "quality_report_id": getattr(
            lot,
            "quality_report_id",
            None,
        ),
        "quality_grade": getattr(
            lot,
            "quality_grade",
            None,
        ),
        "quality_score": getattr(
            lot,
            "quality_score",
            None,
        ),
    }


def build_lot_hash(lot: Any) -> tuple[dict, str]:
    """
    Return canonical record and deterministic SHA-256.
    """

    record = _canonical_lot_record(lot)
    digest = calculate_record_hash(record)

    return record, digest


def anchor_lot(lot: Any) -> dict:
    """
    Anchor a Quality Checker lot on the real blockchain.

    The lot must contain a quality_report_id.

    Returns verified only when:
      - blockchain transaction succeeds
      - receipt status is successful
      - record is read back
      - stored hash matches
    """

    lot_id = (
        getattr(lot, "lot_id", None)
        or getattr(lot, "id", None)
    )

    if not lot_id:
        raise ValueError("Lot has no lot_id")

    quality_report_id = getattr(
        lot,
        "quality_report_id",
        None,
    )

    if not quality_report_id:
        return {
            "status": "pending",
            "verified": False,
            "lot_id": lot_id,
            "reason": "quality_report_required",
        }

    record, digest = build_lot_hash(lot)

    blockchain_result = anchor_hash(
        lot_id,
        digest,
    )

    if blockchain_result.get("status") != "verified":
        raise RuntimeError(
            "Blockchain anchor did not reach verified state"
        )

    verification = verify_hash(
        lot_id,
        digest,
    )

    if not verification.get("verified"):
        raise RuntimeError(
            "On-chain hash verification failed"
        )

    return {
        "status": "verified",
        "verified": True,
        "lot_id": lot_id,
        "quality_report_id": quality_report_id,
        "sha256": digest,
        "blockchain_hash": digest,
        "blockchain_tx": blockchain_result.get("tx_hash"),
        "block_number": blockchain_result.get(
            "block_number"
        ),
        "blockchain_status": "verified",
        "verification_status": "verified",
        "verification_source": (
            "quality_checker_real_blockchain"
        ),
        "timestamp": blockchain_result.get(
            "timestamp"
        ),
        "canonical_record": record,
    }


def verify_lot(lot: Any) -> dict:
    """
    Recalculate the current lot hash and compare it with
    the blockchain.
    """

    lot_id = (
        getattr(lot, "lot_id", None)
        or getattr(lot, "id", None)
    )

    if not lot_id:
        raise ValueError("Lot has no lot_id")

    _, digest = build_lot_hash(lot)

    result = verify_hash(
        lot_id,
        digest,
    )

    return result


def is_quality_checker_lot(lot: Any) -> bool:
    """
    Quality Checker lots are identified by the existing
    quality_report_id field.
    """

    return bool(
        getattr(lot, "quality_report_id", None)
    )


def is_manual_lot(lot: Any) -> bool:
    return not is_quality_checker_lot(lot)
