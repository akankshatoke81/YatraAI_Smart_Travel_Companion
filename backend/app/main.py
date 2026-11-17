import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import Base, engine, active_db_url
from app.api import auth, destinations, regions, navigation, landmarks, recommendations, favourites, users, offline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("yatraai")

# Create tables if not present
try:
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database schema synchronized on {active_db_url}")
except Exception as e:
    logger.error(f"Error during database metadata initialization: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Full-stack AI/ML Travel Companion for Maharashtra (AIML College Project)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory for photos
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(destinations.router, prefix=settings.API_PREFIX)
app.include_router(regions.router, prefix=settings.API_PREFIX)
app.include_router(navigation.router, prefix=settings.API_PREFIX)
app.include_router(landmarks.router, prefix=settings.API_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_PREFIX)
app.include_router(favourites.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(offline.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": "YatraAI - Smart AI/ML Travel Companion for Maharashtra",
        "status": "Operational",
        "version": settings.PROJECT_VERSION,
        "database_connected": bool(active_db_url),
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "yolo_model_path": settings.YOLO_MODEL_PATH
    }

