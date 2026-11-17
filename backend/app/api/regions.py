from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import Region, District, Destination, User
from app.schemas.schemas import RegionCreate, RegionResponse, DistrictCreate, DistrictResponse
from app.api.deps import get_current_admin

router = APIRouter(prefix="/regions", tags=["Regions & Districts"])

@router.get("", response_model=List[RegionResponse])
def get_all_regions(db: Session = Depends(get_db)):
    regions = db.query(Region).order_by(Region.region_name).all()
    return regions

@router.post("", response_model=RegionResponse)
def create_region(
    region_in: RegionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Region).filter(Region.region_name.ilike(region_in.region_name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A region with this name already exists.")

    region = Region(
        region_name=region_in.region_name.strip(),
        description=region_in.description
    )
    db.add(region)
    db.commit()
    db.refresh(region)
    return region

@router.put("/{region_id}", response_model=RegionResponse)
def update_region(
    region_id: int,
    region_in: RegionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    region.region_name = region_in.region_name.strip()
    region.description = region_in.description
    db.commit()
    db.refresh(region)
    return region

@router.delete("/{region_id}")
def delete_region(
    region_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    # Check if any destinations depend on districts in this region
    district_ids = [d.id for d in region.districts]
    dependent_dests = db.query(Destination).filter(Destination.district_id.in_(district_ids)).count() if district_ids else 0
    if dependent_dests > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete region: {dependent_dests} destination(s) are associated with districts in this region."
        )

    db.delete(region)
    db.commit()
    return {"message": f"Region '{region.region_name}' deleted successfully."}

@router.post("/districts", response_model=DistrictResponse)
def create_district(
    dist_in: DistrictCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    region = db.query(Region).filter(Region.id == dist_in.region_id).first()
    if not region:
        raise HTTPException(status_code=400, detail="Target region does not exist.")

    existing = db.query(District).filter(District.district_name.ilike(dist_in.district_name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A district with this name already exists.")

    district = District(
        district_name=dist_in.district_name.strip(),
        region_id=dist_in.region_id
    )
    db.add(district)
    db.commit()
    db.refresh(district)
    return district

