from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from typing import Optional
from app.schemas.diagnosis import DiagnosisResponse
from app.services.diagnosis_service import diagnose_image

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])
MAX_IMAGE_SIZE = 10 * 1024 * 1024

@router.post("/analyze", response_model=DiagnosisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None),
    plot_id: Optional[str] = Form(None),
):
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(413, "Image too large. Max 10MB.")
    return await run_in_threadpool(
        diagnose_image,
        image_bytes,
        crop_hint,
    )
