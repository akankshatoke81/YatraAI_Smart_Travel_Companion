import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "YatraAI - Smart Travel Companion"
    PROJECT_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:password@localhost:3306/yatraai"
    )
    SQLITE_FALLBACK_URL: str = f"sqlite:///{BASE_DIR}/yatraai.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "yatraai_dev_secret_key_change_in_production_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI & Services
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEOAPIFY_API_KEY: str = os.getenv("GEOAPIFY_API_KEY", "")
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", str(BASE_DIR / "models" / "best.pt"))
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    MODELS_DIR: Path = BASE_DIR / "models"

settings = Settings()

# Ensure required directories exist
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)

