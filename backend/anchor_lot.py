#!/usr/bin/env python3

from __future__ import annotations

import os
import sys

from app.core.database import SessionLocal
from app.models.lot import Lot
from app.services.lot_blockchain_service import (
    anchor_lot,
    is_quality_checker_lot,
)


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Usage: python anchor_lot.py LOT_ID",
            file=sys.stderr,
        )
        return 2

    lot_id = sys.argv[1].strip()

    if not lot_id:
        print("[ERROR] LOT_ID is empty.")
        return 2

    db = SessionLocal()

    try:
        lot = (
            db.query(Lot)
            .filter(
                (Lot.lot_id == lot_id)
                | (Lot.id == lot_id)
            )
            .first()
        )

        if lot is None:
            print(f"[ERROR] Lot not found: {lot_id}")
            return 1

        print("Lot:", lot_id)
        print(
            "Quality Report:",
            getattr(
                lot,
                "quality_report_id",
                None,
            ),
        )

        # Manual lots are intentionally blocked here.
        if not is_quality_checker_lot(lot):
            print()
            print(
                "[PENDING] This is a manual lot."
            )
            print(
                "Manual lots require admin approval "
                "before blockchain anchoring."
            )
            return 0

        result = anchor_lot(lot)

        print()
        print("[BLOCKCHAIN RESULT]")
        print(result)

        if not result.get("verified"):
            print(
                "[ERROR] Blockchain verification "
                "did not succeed."
            )
            return 1

        # Only update local DB AFTER blockchain verification.
        if hasattr(lot, "blockchain_hash"):
            lot.blockchain_hash = result[
                "blockchain_hash"
            ]

        if hasattr(lot, "blockchain_tx"):
            lot.blockchain_tx = result.get(
                "blockchain_tx"
            )

        if hasattr(lot, "blockchain_status"):
            lot.blockchain_status = "verified"

        if hasattr(lot, "verification_status"):
            lot.verification_status = "verified"

        if hasattr(lot, "verification_source"):
            lot.verification_source = result.get(
                "verification_source"
            )

        db.commit()

        print()
        print(
            "================================================"
        )
        print(
            " LOT BLOCKCHAIN VERIFICATION PASSED"
        )
        print(
            "================================================"
        )
        print()
        print("Lot:", lot_id)
        print(
            "Blockchain status:",
            "verified",
        )
        print(
            "Verification status:",
            "verified",
        )
        print(
            "Transaction:",
            result.get("blockchain_tx"),
        )
        print(
            "Block:",
            result.get("block_number"),
        )

        return 0

    except Exception as exc:
        db.rollback()
        print()
        print("[ERROR]", type(exc).__name__)
        print(str(exc))
        return 1

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
