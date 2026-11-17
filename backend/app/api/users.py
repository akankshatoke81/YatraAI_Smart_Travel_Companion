from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.all_models import User, Destination, Region, District
from app.schemas.schemas import UserResponse, UserStatusUpdate
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/dashboard")
def get_admin_dashboard_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    total_destinations = db.query(Destination).count()
    total_regions = db.query(Region).count()
    
    # Images metrics
    dests_with_images = db.query(Destination).filter(Destination.image_path.isnot(None), Destination.image_path != "").count()
    dests_missing_images = total_destinations - dests_with_images

    # Recently added destinations
    recent_dests = db.query(Destination).order_by(Destination.created_at.desc()).limit(5).all()
    recent_list = [
        {
            "id": d.id,
            "name": d.name,
            "category": d.category,
            "district": d.district.district_name if d.district else "N/A",
            "created_at": d.created_at
        }
        for d in recent_dests
    ]

    return {
        "total_users": total_users,
        "total_destinations": total_destinations,
        "total_regions": total_regions,
        "images_available": dests_with_images,
        "images_missing": dests_missing_images,
        "recent_destinations": recent_list
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(User)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.role.ilike(search_term))
        )
    users = query.order_by(User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)

    state = "activated" if user.is_active else "deactivated"
    return {"message": f"User '{user.name}' has been {state}.", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")

    user_name = user.name
    db.delete(user)
    db.commit()
    return {"message": f"User account '{user_name}' deleted successfully."}

