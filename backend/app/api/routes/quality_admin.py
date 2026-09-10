from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import QualityReport
from app.models.lot import Lot
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/api/admin/quality",
    tags=["Admin Quality Analytics"],
)


def require_admin(current_user, db):
    uid = current_user.get("uid")
    user = db.query(User).filter(User.uid == uid).first()

    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return user


@router.get("/trends")
def quality_trends(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user, db)

    reports = (
        db.query(QualityReport)
        .order_by(QualityReport.created_at.desc())
        .all()
    )

    lots = db.query(Lot).all()

    grade_counts = {
        "A": 0,
        "B": 0,
        "C": 0,
    }

    for report in reports:
        grade = (report.overall_grade or "").upper()
        if grade in grade_counts:
            grade_counts[grade] += 1

    return {
        "success": True,
        "total_quality_reports": len(reports),
        "grade_a_reports": grade_counts["A"],
        "grade_b_reports": grade_counts["B"],
        "grade_c_reports": grade_counts["C"],
        "total_lots": len(lots),
        "grade_distribution": [
            {"grade": "A", "count": grade_counts["A"]},
            {"grade": "B", "count": grade_counts["B"]},
            {"grade": "C", "count": grade_counts["C"]},
        ],
        "reports": [
            {
                "id": r.id,
                "report_id": r.report_id,
                "lot_id": r.lot_id,
                "commodity": r.commodity,
                "variety": r.variety,
                "overall_grade": r.overall_grade,
                "overall_score": r.overall_score,
                "confidence": r.confidence,
                "sample_count": r.sample_count,
                "created_at": (
                    r.created_at.isoformat()
                    if r.created_at else None
                ),
            }
            for r in reports
        ],
    }
