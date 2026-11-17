import pytest
from app.database.session import SessionLocal, Base, engine
from app.models.all_models import Destination, Region, District
from app.api.destinations import get_destinations
from app.api.navigation import get_travel_estimates
from app.schemas.schemas import TravelEstimateRequest
from app.ai.yolo_detector import yolo_detector

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_strict_region_filtering_pune(db):
    """Test that selecting Pune region returns only Pune destinations."""
    pune_dests = get_destinations(region="Pune Region", db=db)
    assert len(pune_dests) > 0
    for d in pune_dests:
        assert d["region_name"] == "Pune Region"
        assert d["district_name"] == "Pune"

def test_strict_region_filtering_konkan(db):
    """Test that selecting Konkan region returns only Konkan destinations."""
    konkan_dests = get_destinations(region="Konkan Region", db=db)
    assert len(konkan_dests) > 0
    for d in konkan_dests:
        assert d["region_name"] == "Konkan Region"

def test_search_within_region_does_not_leak(db):
    """Test that searching for 'Gateway' in 'Pune Region' returns 0 destinations, never leaking Mumbai destinations."""
    leaked = get_destinations(search="Gateway", region="Pune Region", db=db)
    assert len(leaked) == 0

def test_invalid_region_returns_empty(db):
    """Test that an unknown region returns empty list instead of falling back to all regions."""
    res = get_destinations(region="NonExistentRegion123", db=db)
    assert res == []

def test_travel_estimates_modes(db):
    """Test travel estimates endpoint for all 5 modes."""
    # From Pune Station (18.5284, 73.8739) to Shaniwar Wada (18.5196, 73.8553)
    shaniwar = db.query(Destination).filter(Destination.name.ilike("%Shaniwar Wada%")).first()
    assert shaniwar is not None

    req = TravelEstimateRequest(
        start_lat=18.5284,
        start_lng=73.8739,
        destination_id=shaniwar.id
    )
    res = get_travel_estimates(req=req, db=db)
    assert res.destination_name == "Shaniwar Wada"
    assert res.distance_km > 0
    assert len(res.estimates) == 5

    mode_map = {e.mode: e for e in res.estimates}
    assert "bus" in mode_map
    assert "metro" in mode_map
    assert "auto" in mode_map
    assert "personal_vehicle" in mode_map
    assert "walking" in mode_map

    # Bus is available
    assert mode_map["bus"].available is True
    assert mode_map["bus"].estimated_cost_inr >= 10.0

    # Auto Rickshaw is available for short distance in city
    assert mode_map["auto"].available is True
    assert mode_map["auto"].estimated_cost_inr >= 25.0

    # Walking is available for short distance (<15km)
    assert mode_map["walking"].available is True
    assert mode_map["walking"].estimated_cost_inr == 0.0

def test_travel_estimate_metro_unavailable_for_fort(db):
    """Test that Metro is not available for remote hill forts like Sinhagad Fort."""
    sinhagad = db.query(Destination).filter(Destination.name.ilike("%Sinhagad Fort%")).first()
    assert sinhagad is not None

    req = TravelEstimateRequest(
        start_lat=18.5284,
        start_lng=73.8739,
        destination_id=sinhagad.id
    )
    res = get_travel_estimates(req=req, db=db)
    mode_map = {e.mode: e for e in res.estimates}
    assert mode_map["metro"].available is False
    assert "not available" in mode_map["metro"].unavailable_reason.lower()

def test_yolo_unconfigured_model_handling():
    """Test that missing weights file returns 'not_configured' status rather than fake random output."""
    res = yolo_detector.detect_landmark(image_bytes=b"fake_bytes_data", filename="test.jpg")
    assert res["status"] in ["not_configured", "error"]
    assert res["recognized"] is False

