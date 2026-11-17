from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.all_models import Favourite, Destination, User
from app.api.deps import get_current_user
from app.api.destinations import format_destination_response
from app.schemas.schemas import DestinationResponse

router = APIRouter(prefix="/favourites", tags=["Favourites"])

@router.get("", response_model=List[DestinationResponse])
def get_user_favourites(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    favs = db.query(Favourite).filter(Favourite.user_id == user.id).all()
    dest_list = []
    for f in favs:
        if f.destination:
            dest_list.append(format_destination_response(f.destination))
    return dest_list

@router.post("/{destination_id}/toggle")
def toggle_favourite(
    destination_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    existing_fav = db.query(Favourite).filter(
        Favourite.user_id == user.id,
        Favourite.destination_id == destination_id
    ).first()

    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        return {"favourited": False, "message": f"Removed '{dest.name}' from your favourites."}
    else:
        new_fav = Favourite(user_id=user.id, destination_id=destination_id)
        db.add(new_fav)
        db.commit()
        return {"favourited": True, "message": f"Added '{dest.name}' to your favourites."}

@router.get("/ids")
def get_user_favourite_ids(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    favs = db.query(Favourite.destination_id).filter(Favourite.user_id == user.id).all()
    return [f[0] for f in favs]

