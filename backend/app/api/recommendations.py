from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.all_models import Destination, District, Region, User, Itinerary, ItineraryDestination
from app.schemas.schemas import RecommendationRequest, RecommendationResponse
from app.ai.groq_service import groq_service
from app.api.destinations import format_destination_response
from app.api.deps import get_optional_current_user, get_current_user

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])

@router.post("/generate", response_model=RecommendationResponse)
def generate_recommendations(
    req: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Retrieves filtered candidates from MySQL and invokes Groq LLaMA-3.3
    to construct a budget-aware, distance-optimized itinerary.
    """
    # 1. Retrieve candidates from MySQL with strict region/district constraints
    query = db.query(Destination).join(District).join(Region)

    has_specific_filter = False

    if req.preferred_region and req.preferred_region.lower() != "all":
        has_specific_filter = True
        clean_reg = req.preferred_region.strip().lower()
        base_name = clean_reg.replace(" region", "").strip()
        reg_obj = db.query(Region).filter(
            (Region.region_name.ilike(f"{clean_reg}%")) |
            (Region.region_name.ilike(f"{base_name}%")) |
            (Region.region_name.ilike(f"%{base_name}%"))
        ).first()

        if reg_obj:
            query = query.filter(District.region_id == reg_obj.id)
        else:
            return RecommendationResponse(
                title=f"Itinerary for {req.preferred_region}",
                summary=f"No destinations found in {req.preferred_region}.",
                total_estimated_budget=0.0,
                total_visiting_duration=req.available_time,
                destinations=[],
                ai_generated=False,
                ai_provider="System Filter"
            )

    if req.preferred_district and req.preferred_district.lower() != "all":
        has_specific_filter = True
        query = query.filter(District.district_name.ilike(f"%{req.preferred_district.strip()}%"))

    candidates_db = query.all()

    # If the user specifically filtered for a region or district and no items matched,
    # NEVER leak destinations from other regions.
    if not candidates_db:
        if has_specific_filter:
            target_name = req.preferred_district if req.preferred_district and req.preferred_district.lower() != "all" else req.preferred_region
            return RecommendationResponse(
                title=f"Itinerary for {target_name}",
                summary=f"No destinations found in {target_name}. Please choose another region or select All Regions.",
                total_estimated_budget=0.0,
                total_visiting_duration=req.available_time,
                destinations=[],
                ai_generated=False,
                ai_provider="System Filter"
            )
        else:
            candidates_db = db.query(Destination).join(District).join(Region).all()

    candidates_formatted = [
        format_destination_response(d, req.user_lat, req.user_lng)
        for d in candidates_db
    ]

    # 2. Invoke Groq AI planner with database grounding
    itinerary_result = groq_service.generate_itinerary(
        candidate_destinations=candidates_formatted,
        starting_location=req.starting_location,
        budget=req.total_budget,
        available_time=req.available_time,
        interests=req.interests,
        num_travellers=req.num_travellers,
        travel_type=req.travel_type
    )

    return itinerary_result

@router.post("/save")
def save_itinerary(
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Saves user's AI-generated itinerary into MySQL database."""
    title = data.get("title", "My Maharashtra Trip")
    starting_location = data.get("starting_location", "Maharashtra")
    budget = float(data.get("total_estimated_budget", 0.0))
    available_time = data.get("total_visiting_duration", "1 day")
    destinations = data.get("destinations", [])

    itinerary = Itinerary(
        user_id=user.id,
        title=title,
        starting_location=starting_location,
        budget=budget,
        available_time=available_time
    )
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)

    for item in destinations:
        dest_obj = item.get("destination", {})
        dest_id = dest_obj.get("id")
        if dest_id:
            itinerary_dest = ItineraryDestination(
                itinerary_id=itinerary.id,
                destination_id=dest_id,
                visit_order=item.get("visit_order", 1)
            )
            db.add(itinerary_dest)

    db.commit()
    return {"message": "Itinerary saved successfully.", "itinerary_id": itinerary.id}

@router.get("/saved")
def get_user_saved_itineraries(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    itineraries = db.query(Itinerary).filter(Itinerary.user_id == user.id).order_by(Itinerary.created_at.desc()).all()
    results = []
    for it in itineraries:
        items = []
        for d_assoc in it.destinations:
            if d_assoc.destination:
                items.append({
                    "visit_order": d_assoc.visit_order,
                    "destination": format_destination_response(d_assoc.destination)
                })
        results.append({
            "id": it.id,
            "title": it.title,
            "starting_location": it.starting_location,
            "budget": it.budget,
            "available_time": it.available_time,
            "created_at": it.created_at,
            "destinations": items
        })
    return results

