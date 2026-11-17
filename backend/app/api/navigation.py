import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import Destination
from app.schemas.schemas import (
    AStarRouteRequest, AStarRouteResponse,
    TravelEstimateRequest, TravelEstimateResponse, TravelModeEstimate
)
from app.algorithms.astar import calculate_astar_route, haversine_distance

router = APIRouter(prefix="/navigation", tags=["Navigation & A* Routing"])

def format_travel_time(mins: int) -> str:
    if mins < 60:
        return f"{mins} mins"
    hrs = mins // 60
    rem = mins % 60
    if rem == 0:
        return f"{hrs} hr" if hrs == 1 else f"{hrs} hrs"
    return f"{hrs} hr {rem} mins" if hrs == 1 else f"{hrs} hrs {rem} mins"

def is_in_pune_metro_zone(lat: float, lng: float) -> bool:
    # Pune Metro operational bounding zone (PCMC, Shivajinagar, Swargate, Vanaz, Ramwadi)
    return (18.45 <= lat <= 18.66) and (73.76 <= lng <= 73.96)

def is_in_mumbai_metro_zone(lat: float, lng: float) -> bool:
    # Mumbai Metro operational bounding zone (Line 1, 2A, 7, 3)
    return (18.90 <= lat <= 19.32) and (72.76 <= lng <= 73.12)

@router.post("/route", response_model=AStarRouteResponse)
def compute_astar_route(request: AStarRouteRequest, db: Session = Depends(get_db)):
    """
    Computes an exact A* shortest road path between start and end coordinates.
    Employs Haversine distance heuristic on Maharashtra road network intersections.
    """
    end_lat = request.end_lat
    end_lng = request.end_lng

    if request.destination_id:
        dest = db.query(Destination).filter(Destination.id == request.destination_id).first()
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found.")
        end_lat = dest.latitude
        end_lng = dest.longitude

    try:
        route_result = calculate_astar_route(
            start_lat=request.start_lat,
            start_lng=request.start_lng,
            end_lat=end_lat,
            end_lng=end_lng
        )
        return route_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"A* route calculation failed: {str(e)}"
        )

@router.post("/travel-estimate", response_model=TravelEstimateResponse)
def get_travel_estimates(req: TravelEstimateRequest, db: Session = Depends(get_db)):
    """
    Calculates distance, travel time, and fare estimates for 5 travel modes:
    1. Bus (PMPML / MSRTC)
    2. Metro Rail (Operational Pune / Mumbai corridors)
    3. Auto Rickshaw (Maharashtra RTO fare slabs)
    4. Personal Vehicle (Car / Bike fuel at Rs 105/L)
    5. Walking
    """
    dest_name = "Selected Destination"
    dest_lat = req.dest_lat
    dest_lng = req.dest_lng

    if req.destination_id:
        dest = db.query(Destination).filter(Destination.id == req.destination_id).first()
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found.")
        dest_name = dest.name
        dest_lat = dest.latitude
        dest_lng = dest.longitude

    if dest_lat is None or dest_lng is None:
        raise HTTPException(status_code=400, detail="Destination coordinates (dest_lat, dest_lng) or destination_id required.")

    # Approximate driving/road distance (Haversine straight-line * road winding factor 1.25)
    straight_line = haversine_distance(req.start_lat, req.start_lng, dest_lat, dest_lng)
    road_dist = max(0.5, round(straight_line * 1.25, 1))

    estimates: List[TravelModeEstimate] = []

    # 1. BUS (PMPML / MSRTC / BEST)
    bus_mins = max(10, round((road_dist / 25.0) * 60 + 15))
    bus_cost = max(10.0, round(10.0 + road_dist * 1.5, 0))
    estimates.append(TravelModeEstimate(
        mode="bus",
        mode_name="Bus (PMPML / BEST / MSRTC)",
        available=True,
        distance_km=road_dist,
        travel_time_formatted=format_travel_time(bus_mins),
        travel_time_minutes=bus_mins,
        estimated_cost_inr=bus_cost,
        cost_formatted=f"₹{int(bus_cost)}",
        details="Local municipal transit (PMPML/BEST) in city limits; MSRTC ST buses for inter-district highways.",
        unavailable_reason=None
    ))

    # 2. METRO RAIL
    # Check if both start and destination are within the same operational metro cluster
    both_in_pune = is_in_pune_metro_zone(req.start_lat, req.start_lng) and is_in_pune_metro_zone(dest_lat, dest_lng)
    both_in_mumbai = is_in_mumbai_metro_zone(req.start_lat, req.start_lng) and is_in_mumbai_metro_zone(dest_lat, dest_lng)
    is_fort_or_rural = any(word in dest_name.lower() for word in ["fort", "waterfall", "beach", "caves"])

    metro_available = (both_in_pune or both_in_mumbai) and not is_fort_or_rural

    if metro_available:
        metro_mins = max(8, round((road_dist / 35.0) * 60 + 6))
        metro_cost = min(35.0, max(10.0, round(10.0 + max(0.0, road_dist - 2.0) * 2.8, 0)))
        estimates.append(TravelModeEstimate(
            mode="metro",
            mode_name="Metro Rail",
            available=True,
            distance_km=road_dist,
            travel_time_formatted=format_travel_time(metro_mins),
            travel_time_minutes=metro_mins,
            estimated_cost_inr=metro_cost,
            cost_formatted=f"₹{int(metro_cost)}",
            details="Operational metro rapid rail transit with dedicated stations and contactless ticketing.",
            unavailable_reason=None
        ))
    else:
        estimates.append(TravelModeEstimate(
            mode="metro",
            mode_name="Metro Rail",
            available=False,
            distance_km=road_dist,
            travel_time_formatted="N/A",
            travel_time_minutes=0,
            estimated_cost_inr=0.0,
            cost_formatted="Not Available",
            details="Metro services are not operational for this route or destination.",
            unavailable_reason="Metro service is not available for this route/destination. Operational lines are currently limited to central Pune and Mumbai urban corridors."
        ))

    # 3. AUTO RICKSHAW
    if road_dist <= 45.0:
        auto_mins = max(5, round((road_dist / 30.0) * 60))
        # Maharashtra RTO meter: ₹25 for first 1.5 km, ₹17/km thereafter
        if road_dist <= 1.5:
            auto_cost = 25.0
        else:
            auto_cost = round(25.0 + (road_dist - 1.5) * 17.0, 0)

        estimates.append(TravelModeEstimate(
            mode="auto",
            mode_name="Auto Rickshaw",
            available=True,
            distance_km=road_dist,
            travel_time_formatted=format_travel_time(auto_mins),
            travel_time_minutes=auto_mins,
            estimated_cost_inr=auto_cost,
            cost_formatted=f"₹{int(auto_cost)}",
            details="Official Maharashtra RTO metered rate (₹25 base for 1.5 km, ₹17/km thereafter).",
            unavailable_reason=None
        ))
    else:
        estimates.append(TravelModeEstimate(
            mode="auto",
            mode_name="Auto Rickshaw",
            available=False,
            distance_km=road_dist,
            travel_time_formatted="N/A",
            travel_time_minutes=0,
            estimated_cost_inr=0.0,
            cost_formatted="Not Available",
            details="Auto Rickshaws operate within municipal and district boundaries.",
            unavailable_reason="Auto Rickshaws are restricted to urban/suburban zones (<45 km). For inter-city transit, please use Bus, Train, or Personal Vehicle."
        ))

    # 4. PERSONAL VEHICLE (Car / Two-Wheeler)
    veh_mins = max(5, round((road_dist / 45.0) * 60))
    # Fuel estimate based on ₹105/L petrol:
    # Car avg: 14 km/L -> ~₹7.50/km. Bike avg: 40 km/L -> ~₹2.60/km.
    car_fuel = round(road_dist * 7.5, 0)
    bike_fuel = round(road_dist * 2.6, 0)
    estimates.append(TravelModeEstimate(
        mode="personal_vehicle",
        mode_name="Personal Vehicle (Car / Bike)",
        available=True,
        distance_km=road_dist,
        travel_time_formatted=format_travel_time(veh_mins),
        travel_time_minutes=veh_mins,
        estimated_cost_inr=car_fuel,
        cost_formatted=f"₹{int(bike_fuel)} (Bike) / ₹{int(car_fuel)} (Car)",
        details=f"Estimated fuel based on petrol @ ₹105/L (Car ~14 km/L, Bike ~40 km/L). State highway tolls may apply.",
        unavailable_reason=None
    ))

    # 5. WALKING
    if road_dist <= 15.0:
        walk_mins = max(5, round((road_dist / 4.5) * 60))
        estimates.append(TravelModeEstimate(
            mode="walking",
            mode_name="Walking",
            available=True,
            distance_km=road_dist,
            travel_time_formatted=format_travel_time(walk_mins),
            travel_time_minutes=walk_mins,
            estimated_cost_inr=0.0,
            cost_formatted="Free",
            details="Eco-friendly heritage walking trail. Average pace 4.5 km/h.",
            unavailable_reason=None
        ))
    else:
        estimates.append(TravelModeEstimate(
            mode="walking",
            mode_name="Walking",
            available=False,
            distance_km=road_dist,
            travel_time_formatted="N/A",
            travel_time_minutes=0,
            estimated_cost_inr=0.0,
            cost_formatted="Not Feasible",
            details="Distance exceeds practical walking endurance.",
            unavailable_reason=f"Walking distance ({road_dist} km) exceeds practical walking range (>15 km). Please select motorized transit."
        ))

    return TravelEstimateResponse(
        start_coordinates=[req.start_lat, req.start_lng],
        destination_coordinates=[dest_lat, dest_lng],
        destination_name=dest_name,
        distance_km=road_dist,
        estimates=estimates
    )
