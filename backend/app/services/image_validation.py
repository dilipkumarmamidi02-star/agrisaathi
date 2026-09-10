from fastapi import UploadFile, HTTPException
from app.core.config import settings

async def validate_image_batch(files: list[UploadFile]) -> list[bytes]:
    minimum = settings.min_images_per_request
    maximum = settings.max_images_per_request

    if len(files) < minimum:
        raise HTTPException(
            status_code=422,
            detail=f"Upload at least {minimum} images (got {len(files)}).",
        )

    if len(files) > maximum:
        raise HTTPException(
            status_code=422,
            detail=f"Upload at most {maximum} images (got {len(files)}).",
        )

    images = []

    for file in files:
        data = await file.read()

        if not data:
            raise HTTPException(
                status_code=422,
                detail=f"Empty image upload: {file.filename or 'unnamed file'}.",
            )

        images.append(data)

    return images
