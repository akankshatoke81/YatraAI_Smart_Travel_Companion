import pytest
from app.main import root, health_check
from app.database.session import SessionLocal
from app.api.destinations import get_destinations, get_destination_by_id, get_categories
from app.api.auth import register, login
from app.api.regions import get_all_regions
from app.api.navigation import compute_astar_route
from app.api.recommendations import generate_recommendations
from app.api.offline import get_offline_pack_bundle
from app.schemas.schemas import (
    UserRegister, UserLogin, AStarRouteRequest, RecommendationRequest
)
from app.algorithms.astar import calculate_astar_route, haversine_distance

class DummyResponse:
    def __init__(self):
        self.cookies = {}
    def set_cookie(self, key, value, **kwargs):
        self.cookies[key] = value
    def delete_cookie(self, key):
        self.cookies.pop(key, None)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_root():
    data = root()
    assert "YatraAI" in data["project"]
    assert data["status"] == "Operational"

def test_health():
    data = health_check()
    assert data["status"] == "healthy"

def test_get_public_destinations(db):
    dests = get_destinations(
        search=None, region=None, district=None, category=None,
        user_lat=18.52, user_lng=73.85, limit=50, db=db
    )
    assert len(dests) >= 10
    names = [d["name"] for d in dests]
    assert "Shaniwar Wada" in names
    assert "Gateway of India" in names
    assert "Sinhagad Fort" in names

def test_destination_details(db):
    dests = get_destinations(search="Shaniwar", region=None, district=None, category=None, db=db)
    assert len(dests) > 0
    dest_id = dests[0]["id"]
    detail = get_destination_by_id(destination_id=dest_id, user_lat=18.52, user_lng=73.85, db=db)
    assert detail["name"] == "Shaniwar Wada"
    assert detail["category"] == "Forts"
    assert "history" in detail
    assert "architecture" in detail

def test_admin_login(db):
    resp = DummyResponse()
    res = login(login_in=UserLogin(email="admin", password="admin"), response=resp, db=db)
    assert "access_token" in res
    assert res["user"]["role"] == "admin"
    assert "access_token" in resp.cookies

def test_user_registration_and_login(db):
    import uuid
    resp = DummyResponse()
    email = f"test_{uuid.uuid4().hex[:6]}@yatraai.demo"
    reg_in = UserRegister(
        name="Test Traveler",
        email=email,
        age=24,
        password="password123",
        confirm_password="password123"
    )
    reg_res = register(user_in=reg_in, response=resp, db=db)
    assert reg_res["user"]["role"] == "user"

    # Login with new account
    login_res = login(login_in=UserLogin(email=email, password="password123"), response=resp, db=db)
    assert login_res["user"]["email"] == email

def test_astar_routing_algorithm():
    route = calculate_astar_route(
        start_lat=18.5196,
        start_lng=73.8553,
        end_lat=18.3663,
        end_lng=73.7558
    )
    assert route["distance_km"] > 0
    assert route["duration_minutes"] > 0
    assert len(route["coordinates"]) >= 2
    assert "A*" in route["algorithm"]

def test_recommendation_pipeline(db):
    req = RecommendationRequest(
        starting_location="Pune Station",
        preferred_region="Pune Region",
        total_budget=1800.0,
        available_time="1 day",
        interests=["Forts", "Heritage"],
        num_travellers=2,
        travel_type="Heritage"
    )
    res = generate_recommendations(req=req, db=db)
    assert "destinations" in res
    assert len(res["destinations"]) > 0
    assert res["total_estimated_budget"] > 0

def test_offline_pack(db):
    pack = get_offline_pack_bundle(region=None, db=db)
    assert pack["total_destinations"] >= 10
    assert len(pack["road_network_nodes"]) > 0
