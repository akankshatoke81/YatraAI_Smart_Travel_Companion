import re
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str
    age: Optional[int] = Field(None, ge=5, le=120)
    password: str = Field(..., min_length=4)
    confirm_password: str = Field(..., min_length=4)

    @field_validator("email")
    def validate_email_format(cls, v):
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    def validate_email_format(cls, v):
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    age: Optional[int]
    role: str
    is_active: bool
    created_at: datetime

class UserStatusUpdate(BaseModel):
    is_active: bool

# --- REGION & DISTRICT SCHEMAS ---
class DistrictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    district_name: str
    region_id: int

class DistrictCreate(BaseModel):
    district_name: str
    region_id: int

class RegionBase(BaseModel):
    region_name: str
    description: Optional[str] = None

class RegionCreate(RegionBase):
    pass

class RegionResponse(RegionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    districts: List[DistrictResponse] = []


# --- DESTINATION SCHEMAS ---
class DestinationBase(BaseModel):
    name: str
    description: str
    district_id: int
    category: str
    latitude: float
    longitude: float
    entry_fee: float = 0.0
    opening_hours: Optional[str] = "09:00 AM - 06:00 PM"
    visit_duration: Optional[str] = "2 hours"
    history: Optional[str] = None
    architecture: Optional[str] = None
    image_path: Optional[str] = None
    image_source: Optional[str] = None
    image_attribution: Optional[str] = None

class DestinationCreate(DestinationBase):
    pass

class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    district_id: Optional[int] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    entry_fee: Optional[float] = None
    opening_hours: Optional[str] = None
    visit_duration: Optional[str] = None
    history: Optional[str] = None
    architecture: Optional[str] = None
    image_path: Optional[str] = None
    image_source: Optional[str] = None
    image_attribution: Optional[str] = None

class DestinationResponse(DestinationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    district_name: Optional[str] = None
    region_name: Optional[str] = None
    distance_km: Optional[float] = None
    estimated_travel_time: Optional[str] = None
    created_at: datetime

# --- A* ROUTING SCHEMAS ---
class AStarRouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    destination_id: Optional[int] = None

class RouteCoordinate(BaseModel):
    lat: float
    lng: float

class AStarRouteResponse(BaseModel):
    distance_km: float
    duration_minutes: int
    steps_count: int
    coordinates: List[List[float]]  # [[lat, lng], [lat, lng], ...]
    algorithm: str = "A* (A-Star) with Haversine Heuristic"
    graph_source: str

# --- AI RECOMMENDER SCHEMAS ---
class RecommendationRequest(BaseModel):
    starting_location: str
    preferred_region: Optional[str] = None
    preferred_district: Optional[str] = None
    total_budget: float = Field(default=2000.0, ge=0)
    available_time: str = "1 day"  # "Half day", "1 day", "2 days", "3 days"
    interests: List[str] = []
    num_travellers: int = 1
    travel_type: str = "Budget Friendly"  # "Budget Friendly", "Family", "Adventure", "Heritage"
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None

class ItineraryDestinationItem(BaseModel):
    destination: DestinationResponse
    visit_order: int
    suggested_time_slot: str
    reason: str
    estimated_cost: float

class RecommendationResponse(BaseModel):
    title: str
    summary: str
    total_estimated_budget: float
    total_visiting_duration: str
    destinations: List[ItineraryDestinationItem]
    ai_generated: bool
    ai_provider: str = "Groq LLaMA-3 / Rule-Based Fallback"

# --- AI EXPLANATION SCHEMAS ---
class AIExplanationRequest(BaseModel):
    destination_id: int
    aspect: Optional[str] = "all"  # "history", "architecture", "cultural_significance", "fun_facts", "all"

class AIExplanationResponse(BaseModel):
    destination_id: int
    destination_name: str
    historical_explanation: str
    architecture_explanation: str
    cultural_significance: str
    interesting_facts: List[str]
    suggested_visit_duration: str
    source: str  # "Groq AI (Grounding Verified)" or "Curated Archive (Verified)"

# --- SCANNER SCHEMAS ---
class LandmarkDetectionResult(BaseModel):
    status: str = "success"  # "success", "not_configured", "not_recognized", "error"
    recognized: bool
    landmark_name: Optional[str] = None
    confidence: float = 0.0
    bounding_box: Optional[List[float]] = None  # [x1, y1, x2, y2]
    destination: Optional[DestinationResponse] = None
    message: str
    model_used: str

# --- TRAVEL MODE ESTIMATION SCHEMAS ---
class TravelModeEstimate(BaseModel):
    mode: str  # "bus", "metro", "auto", "personal_vehicle", "walking"
    mode_name: str
    available: bool
    distance_km: float
    travel_time_formatted: str
    travel_time_minutes: int
    estimated_cost_inr: float
    cost_formatted: str
    details: str
    unavailable_reason: Optional[str] = None

class TravelEstimateRequest(BaseModel):
    start_lat: float
    start_lng: float
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    destination_id: Optional[int] = None

class TravelEstimateResponse(BaseModel):
    start_coordinates: List[float]
    destination_coordinates: List[float]
    destination_name: str
    distance_km: float
    estimates: List[TravelModeEstimate]

