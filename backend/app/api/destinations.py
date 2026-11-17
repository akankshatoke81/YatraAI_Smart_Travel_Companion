import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database.session import get_db
from app.models.all_models import Destination, District, Region, User, Favourite
from app.schemas.schemas import (
    DestinationCreate, DestinationUpdate, DestinationResponse,
    AIExplanationRequest, AIExplanationResponse
)
from app.algorithms.astar import haversine_distance
from app.ai.groq_service import groq_service
from app.api.deps import get_current_admin, get_optional_current_user
from app.core.config import settings

router = APIRouter(prefix="/destinations", tags=["Destinations"])

def format_destination_response(d: Destination, user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> dict:
    data = {
        "id": d.id,
        "name": d.name,
        "description": d.description,
        "district_id": d.district_id,
        "district_name": d.district.district_name if d.district else "Maharashtra",
        "region_name": d.district.region.region_name if d.district and d.district.region else "Maharashtra",
        "category": d.category,
        "latitude": d.latitude,
        "longitude": d.longitude,
        "entry_fee": d.entry_fee,
        "opening_hours": d.opening_hours,
        "visit_duration": d.visit_duration,
        "history": d.history,
        "architecture": d.architecture,
        "image_path": d.image_path,
        "image_source": d.image_source,
        "image_attribution": d.image_attribution,
        "created_at": d.created_at,
    }

    if isinstance(user_lat, (int, float)) and isinstance(user_lng, (int, float)):
        dist = haversine_distance(user_lat, user_lng, d.latitude, d.longitude)
        data["distance_km"] = round(dist, 1)
        # Approximate travel time (45 km/h avg)
        hrs = dist / 45.0
        if hrs < 1.0:
            data["estimated_travel_time"] = f"{int(hrs * 60)} mins"
        else:
            data["estimated_travel_time"] = f"{int(hrs)} hr {int((hrs % 1) * 60)} mins"
    else:
        data["distance_km"] = None
        data["estimated_travel_time"] = None

    return data


def unwrap_param(val):
    if hasattr(val, "default"):
        return val.default
    return val

@router.get("", response_model=List[DestinationResponse])
def get_destinations(
    search: Optional[str] = Query(None, description="Search by name, description or district"),
    region: Optional[str] = Query(None, description="Filter by region name"),
    region_id: Optional[int] = Query(None, description="Filter by exact region ID"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    district_id: Optional[int] = Query(None, description="Filter by exact district ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    # Unwrap any FastAPI Query instances when invoked directly in tests
    search = unwrap_param(search)
    region = unwrap_param(region)
    region_id = unwrap_param(region_id)
    district = unwrap_param(district)
    district_id = unwrap_param(district_id)
    category = unwrap_param(category)
    user_lat = unwrap_param(user_lat)
    user_lng = unwrap_param(user_lng)
    limit = unwrap_param(limit)
    int_limit = int(limit) if limit is not None else 100

    query = db.query(Destination).join(District).join(Region)

    # 1. Exact or Named Region Filter (Enforce foreign key relationship District.region_id)
    if region_id is not None:
        query = query.filter(District.region_id == region_id)
    elif region and region.strip().lower() != "all":
        clean_reg = region.strip().lower()
        base_name = clean_reg.replace(" region", "").strip()
        reg_obj = db.query(Region).filter(
            (Region.region_name.ilike(f"{clean_reg}%")) |
            (Region.region_name.ilike(f"{base_name}%")) |
            (Region.region_name.ilike(f"%{base_name}%"))
        ).first()

        if reg_obj:
            query = query.filter(District.region_id == reg_obj.id)
        else:
            # Region not recognized or has no records -> strictly empty
            return []

    # 2. District Filter
    if district_id is not None:
        query = query.filter(Destination.district_id == district_id)
    elif district and district.strip().lower() != "all":
        clean_dist = district.strip().lower()
        query = query.filter(District.district_name.ilike(f"%{clean_dist}%"))

    # 3. Category Filter
    if category and category.strip().lower() != "all":
        query = query.filter(Destination.category.ilike(f"%{category.strip()}%"))

    # 4. Search Filter (Applied within region/district constraint)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Destination.name.ilike(search_term),
                Destination.description.ilike(search_term),
                District.district_name.ilike(search_term),
                Destination.category.ilike(search_term)
            )
        )

    items = query.limit(int_limit).all()
    results = [format_destination_response(d, user_lat, user_lng) for d in items]

    if user_lat is not None and user_lng is not None:
        results.sort(key=lambda x: x["distance_km"] or 99999)

    return results


@router.get("/nearby", response_model=List[DestinationResponse])
def get_nearby_destinations(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(150.0, description="Search radius in kilometers"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    all_dests = db.query(Destination).join(District).join(Region).all()
    nearby_list = []

    for d in all_dests:
        dist = haversine_distance(lat, lng, d.latitude, d.longitude)
        if dist <= radius_km:
            item = format_destination_response(d, lat, lng)
            nearby_list.append(item)

    nearby_list.sort(key=lambda x: x["distance_km"])
    return nearby_list[:limit]

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Destination.category).distinct().all()
    cats = sorted(list({c[0] for c in categories if c[0]}))
    default_cats = ["Heritage", "Forts", "Temples", "Architecture", "Nature", "Beaches", "Museums", "Food & Culture"]
    for c in default_cats:
        if c not in cats:
            cats.append(c)
    return cats

@router.get("/{destination_id}", response_model=DestinationResponse)
def get_destination_by_id(
    destination_id: int,
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")
    return format_destination_response(dest, user_lat, user_lng)

@router.post("/{destination_id}/explain", response_model=AIExplanationResponse)
def explain_destination(
    destination_id: int,
    request: AIExplanationRequest,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    dest_dict = format_destination_response(dest)
    explanation = groq_service.explain_destination(dest_dict, aspect=request.aspect or "all")
    return explanation

# Admin Routes
@router.post("", response_model=DestinationResponse)
def create_destination(
    dest_in: DestinationCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Destination).filter(Destination.name.ilike(dest_in.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A destination with this name already exists.")

    district = db.query(District).filter(District.id == dest_in.district_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="District does not exist.")

    new_dest = Destination(**dest_in.model_dump())
    db.add(new_dest)
    db.commit()
    db.refresh(new_dest)
    return format_destination_response(new_dest)

@router.put("/{destination_id}", response_model=DestinationResponse)
def update_destination(
    destination_id: int,
    dest_in: DestinationUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    update_data = dest_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(dest, field, val)

    db.commit()
    db.refresh(dest)
    return format_destination_response(dest)

@router.delete("/{destination_id}")
def delete_destination(
    destination_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    db.delete(dest)
    db.commit()
    return {"message": f"Destination '{dest.name}' deleted successfully."}

@router.post("/{destination_id}/upload-photo")
def upload_destination_photo(
    destination_id: int,
    file: UploadFile = File(...),
    attribution: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images are allowed.")

    file_name = f"dest_{destination_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = settings.UPLOADS_DIR / file_name

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    dest.image_path = f"/uploads/{file_name}"
    if attribution:
        dest.image_attribution = attribution
    if source:
        dest.image_source = source

    db.commit()
    db.refresh(dest)

    return {
        "message": "Photo uploaded successfully.",
        "image_path": dest.image_path,
        "image_attribution": dest.image_attribution
    }
