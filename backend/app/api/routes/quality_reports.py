import hashlib
import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import (
    QualityReport,
    QualitySample,
    QualitySession,
)
from app.services.quality_service import (
    analyze_quality_images,
)

router = APIRouter(
    prefix="/api/quality-reports",
    tags=["Quality Reports"],
)


def _grade(score: float) -> str:

    if score >= 85:
        return "A"

    if score >= 70:
        return "B"

    return "C"


def _serialize_report(
    report: QualityReport,
) -> dict[str, Any]:

    return {
        "id": report.id,
        "report_id": report.report_id,
        "session_id": report.session_id,
        "farmer_id": report.farmer_id,
        "farm_id": report.farm_id,
        "lot_id": report.lot_id,
        "commodity": report.commodity,
        "variety": report.variety,
        "sample_count": report.sample_count,
        "sample_ids": report.sample_ids or [],
        "ai_model": report.ai_model,
        "ai_model_version": report.ai_model_version,
        "overall_grade": report.overall_grade,
        "overall_score": report.overall_score,
        "confidence": report.confidence,
        "quality_parameters": (
            report.quality_parameters or {}
        ),
        "mean_score": report.mean_score,
        "score_variance": report.score_variance,
        "outlier_samples": (
            report.outlier_samples or []
        ),
        "consistency_note": report.consistency_note,
        "report_hash": report.report_hash,
        "blockchain_tx": report.blockchain_tx,
        "blockchain_status": (
            report.blockchain_status
        ),
        "verification_status": (
            report.verification_status
        ),
        "shared_with": report.shared_with or [],
        "is_public": bool(
            report.is_public
        ),
        "created_by": report.created_by,
        "created_at": (
            report.created_at.isoformat()
            if report.created_at
            else None
        ),
        "updated_at": (
            report.updated_at.isoformat()
            if report.updated_at
            else None
        ),
    }


@router.get("")
@router.get("/")
def list_quality_reports(
    current_user: dict = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    uid = current_user.get("uid")

    reports = (
        db.query(QualityReport)
        .filter(
            QualityReport.farmer_id == uid
        )
        .order_by(
            QualityReport.created_at.desc()
        )
        .all()
    )

    return {
        "quality_reports": [
            _serialize_report(report)
            for report in reports
        ],
        "total": len(reports),
    }


@router.post("/analyze")
async def analyze_quality(
    commodity: str = Form(...),
    variety: str = Form(""),
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    commodity = commodity.strip()

    variety = (
        variety.strip()
        if variety
        else ""
    )

    if not commodity:
        raise HTTPException(
            status_code=400,
            detail="Commodity is required.",
        )

    if len(files) < 5:
        raise HTTPException(
            status_code=400,
            detail="Minimum 5 samples required.",
        )

    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 samples allowed.",
        )

    farmer_id = current_user.get(
        "uid"
    )

    if not farmer_id:
        raise HTTPException(
            status_code=401,
            detail=(
                "Authenticated user UID is missing."
            ),
        )

    image_bytes_list = []

    for index, upload in enumerate(
        files,
        start=1,
    ):

        image_bytes = await upload.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Sample {index} is empty."
                ),
            )

        if len(image_bytes) > (
            10 * 1024 * 1024
        ):
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Sample {index} exceeds "
                    "the 10MB limit."
                ),
            )

        image_bytes_list.append(
            image_bytes
        )

    session_id = str(
        uuid.uuid4()
    )

    report_id = (
        "QR-"
        + datetime.utcnow().strftime(
            "%Y%m%d"
        )
        + "-"
        + uuid.uuid4().hex[:8].upper()
    )

    session = QualitySession(
        id=session_id,
        farmer_id=farmer_id,
        commodity=commodity,
        variety=variety or None,
        sample_count=len(
            image_bytes_list
        ),
        status="analyzing",
        ai_model="vision_router",
        ai_model_version=(
            "gemini-3.8-flash"
            "|qwen/qwen3.6-27b"
            "|gemma4:latest"
        ),
        created_by=farmer_id,
    )

    db.add(session)
    db.flush()

    try:

        analysis = analyze_quality_images(
            image_bytes_list=image_bytes_list,
            commodity=commodity,
            variety=variety or None,
        )

    except ValueError as exc:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=502,
            detail={
                "message": (
                    "All quality analysis "
                    "providers failed."
                ),
                "commodity": commodity,
                "technical_error": str(exc),
            },
        ) from exc

    results = analysis.get(
        "results",
        [],
    )

    if len(results) != len(
        image_bytes_list
    ):

        db.rollback()

        raise HTTPException(
            status_code=502,
            detail=(
                "AI quality router returned "
                "an incomplete sample set."
            ),
        )

    source = analysis.get(
        "source",
        "unknown",
    )

    model = analysis.get(
        "model",
        "unknown",
    )

    providers_attempted = (
        analysis.get(
            "providers_attempted",
            [],
        )
    )

    provider_errors = (
        analysis.get(
            "provider_errors",
            [],
        )
    )

    sample_ids = []
    scores = []
    confidences = []

    for index, result in enumerate(
        results,
        start=1,
    ):

        sample_number = int(
            result.get(
                "sample_number",
                index,
            )
        )

        sample_id = str(
            uuid.uuid4()
        )

        sample_ids.append(
            sample_id
        )

        score = float(
            result.get(
                "score",
                0,
            )
        )

        confidence = float(
            result.get(
                "confidence",
                0,
            )
        )

        scores.append(score)
        confidences.append(
            confidence
        )

        sample = QualitySample(
            id=sample_id,
            session_id=session_id,
            farmer_id=farmer_id,
            sample_number=sample_number,
            file_url=None,
            storage_path=None,
            validation_status="valid",
            validation_message=(
                "AI quality analysis completed "
                f"using {source}."
            ),
            ai_result=result,
            sample_score=score,
            is_outlier=False,
            created_by=farmer_id,
        )

        db.add(sample)

    mean_score = (
        sum(scores)
        / len(scores)
    )

    variance = (
        sum(
            (
                score
                - mean_score
            ) ** 2
            for score in scores
        )
        / len(scores)
    )

    overall_confidence = (
        sum(confidences)
        / len(confidences)
    )

    grade = _grade(
        mean_score
    )

    parameters = {
        "samples": results,
        "sample_scores": scores,
        "providers_attempted": (
            providers_attempted
        ),
        "provider_errors": (
            provider_errors
        ),
        "selected_provider": source,
        "selected_model": model,
    }

    report_payload = {
        "report_id": report_id,
        "session_id": session_id,
        "farmer_id": farmer_id,
        "commodity": commodity,
        "variety": variety,
        "overall_grade": grade,
        "overall_score": mean_score,
        "confidence": overall_confidence,
        "sample_ids": sample_ids,
        "selected_provider": source,
        "selected_model": model,
    }

    report_hash = hashlib.sha256(
        json.dumps(
            report_payload,
            sort_keys=True,
            default=str,
        ).encode()
    ).hexdigest()

    report = QualityReport(
        id=str(
            uuid.uuid4()
        ),
        report_id=report_id,
        session_id=session_id,
        farmer_id=farmer_id,
        commodity=commodity,
        variety=variety or None,
        sample_count=len(
            image_bytes_list
        ),
        sample_ids=sample_ids,
        ai_model=source,
        ai_model_version=model,
        overall_grade=grade,
        overall_score=round(
            mean_score,
            2,
        ),
        confidence=round(
            overall_confidence,
            4,
        ),
        quality_parameters=parameters,
        mean_score=round(
            mean_score,
            2,
        ),
        score_variance=round(
            variance,
            4,
        ),
        outlier_samples=[],
        consistency_note=(
            "Assessment generated from "
            f"{len(image_bytes_list)} visual "
            f"samples using {source}."
        ),
        report_hash=report_hash,
        blockchain_status="pending",
        verification_status="pending",
        is_public=False,
        created_by=farmer_id,
    )

    session.status = "completed"
    session.overall_grade = grade
    session.overall_score = round(
        mean_score,
        2,
    )
    session.confidence = round(
        overall_confidence,
        4,
    )
    session.quality_parameters = (
        parameters
    )
    session.analysis_timestamp = (
        datetime.utcnow()
    )
    session.report_id = report_id

    db.add(report)

    db.commit()

    db.refresh(report)

    return _serialize_report(
        report
    )
