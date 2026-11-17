import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import Destination, District, Region
from app.schemas.schemas import LandmarkDetectionResult, DestinationResponse
from app.ai.yolo_detector import yolo_detector
from app.api.destinations import format_destination_response

router = APIRouter(prefix="/landmarks", tags=["Landmark Scanner (YOLO)"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("/scan", response_model=LandmarkDetectionResult)
async def scan_monument_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Submits user camera photo or uploaded snapshot to YOLO landmark detection model.
    Validates file format (JPG, JPEG, PNG, WEBP) and size (<10MB).
    Matches the detected landmark name directly to MySQL destination records.
    """
    # Validate extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if ext not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Only JPG, JPEG, PNG, and WEBP images are supported."
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image submitted.")

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image size exceeds the 10MB limit (submitted: {len(image_bytes) / (1024 * 1024):.1f}MB)."
        )

    # Run detection
    detection = yolo_detector.detect_landmark(image_bytes=image_bytes, filename=filename)

    status_code = detection.get("status", "error")
    if not detection.get("recognized") or not detection.get("landmark_name"):
        return {
            "status": status_code,
            "recognized": False,
            "landmark_name": None,
            "confidence": 0.0,
            "bounding_box": None,
            "destination": None,
            "message": detection.get("message", "Landmark not recognized."),
            "model_used": detection.get("model_used", "YOLO Landmark Detector")
        }

    # Match landmark name to database
    landmark_query = detection["landmark_name"]
    # Look for exact or fuzzy match
    dest = db.query(Destination).filter(
        (Destination.name.ilike(f"%{landmark_query}%")) |
        (Destination.name.ilike(f"%{landmark_query.split()[0]}%"))
    ).first()

    matched_dest_response = None
    if dest:
        matched_dest_response = format_destination_response(dest)

    return {
        "status": "success",
        "recognized": True,
        "landmark_name": detection["landmark_name"],
        "confidence": detection["confidence"],
        "bounding_box": detection.get("bounding_box"),
        "destination": matched_dest_response,
        "message": detection["message"],
        "model_used": detection["model_used"]
    }
