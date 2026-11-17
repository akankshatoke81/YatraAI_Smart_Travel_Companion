from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.all_models import Destination, Region, District
from app.api.destinations import format_destination_response
from app.algorithms.astar import GLOBAL_ROAD_GRAPH

router = APIRouter(prefix="/offline", tags=["Offline Mode"])

@router.get("/bundle")
def get_offline_pack_bundle(
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Exports a lightweight, structured JSON package of destinations,
    geographical coordinates, and road network vertices for browser IndexedDB storage.
    Enables offline access without violating OpenStreetMap public tile usage policies.
    """
    query = db.query(Destination).join(District).join(Region)
    if region and region.lower() != "all":
        query = query.filter(Region.region_name.ilike(f"%{region.strip()}%"))

    destinations = query.all()
    dest_data = [format_destination_response(d) for d in destinations]

    # Export graph road nodes for offline A* client or offline coordinate matching
    graph_nodes = [
        {"id": nid, "lat": node.lat, "lng": node.lng, "name": node.name}
        for nid, node in GLOBAL_ROAD_GRAPH.nodes.items()
    ]

    return {
        "version": "1.0",
        "total_destinations": len(dest_data),
        "region_filter": region or "All Maharashtra",
        "destinations": dest_data,
        "road_network_nodes": graph_nodes,
        "features_available_offline": [
            "Destination Guides & Historical Details",
            "GPS Coordinate Viewer & Compass AR Vector",
            "Emergency Contacts & Travel Durations",
            "Pre-saved Itineraries & Local Cache"
        ]
    }

