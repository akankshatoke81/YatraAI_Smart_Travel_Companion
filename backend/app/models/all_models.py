from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "admin" or "user"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    favourites = relationship("Favourite", back_populates="user", cascade="all, delete-orphan")
    itineraries = relationship("Itinerary", back_populates="user", cascade="all, delete-orphan")

class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    region_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    districts = relationship("District", back_populates="region", cascade="all, delete-orphan")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_name = Column(String(100), unique=True, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="CASCADE"), nullable=False)

    region = relationship("Region", back_populates="districts")
    destinations = relationship("Destination", back_populates="district", cascade="all, delete-orphan")

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Heritage, Forts, Temples, Nature, Beaches, Architecture, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    entry_fee = Column(Float, default=0.0, nullable=False)
    opening_hours = Column(String(100), default="09:00 AM - 06:00 PM", nullable=True)
    visit_duration = Column(String(50), default="2 hours", nullable=True)
    history = Column(Text, nullable=True)
    architecture = Column(Text, nullable=True)
    image_path = Column(String(255), nullable=True)
    image_source = Column(String(255), nullable=True)
    image_attribution = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    district = relationship("District", back_populates="destinations")
    favourites = relationship("Favourite", back_populates="destination", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryDestination", back_populates="destination", cascade="all, delete-orphan")

class Favourite(Base):
    __tablename__ = "favourites"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="favourites")
    destination = relationship("Destination", back_populates="favourites")

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    starting_location = Column(String(150), nullable=False)
    budget = Column(Float, default=0.0, nullable=False)
    available_time = Column(String(50), default="1 day", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="itineraries")
    destinations = relationship("ItineraryDestination", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryDestination.visit_order")

class ItineraryDestination(Base):
    __tablename__ = "itinerary_destinations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    visit_order = Column(Integer, nullable=False, default=1)

    itinerary = relationship("Itinerary", back_populates="destinations")
    destination = relationship("Destination", back_populates="itinerary_items")

