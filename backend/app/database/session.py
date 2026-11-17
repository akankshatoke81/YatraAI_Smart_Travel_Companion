import logging
import socket
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def is_database_reachable(db_url: str) -> bool:
    """Fast non-blocking port probe to prevent slow OS TCP timeout on localhost."""
    if "sqlite" in db_url:
        return True
    try:
        parsed = urlparse(db_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 3306
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

def get_database_engine():
    db_url = settings.DATABASE_URL
    if is_database_reachable(db_url):
        try:
            engine = create_engine(
                db_url, 
                pool_pre_ping=True, 
                pool_recycle=3600,
                connect_args={"connect_timeout": 2} if "mysql" in db_url else {}
            )
            with engine.connect() as conn:
                pass
            logger.info(f"Connected successfully to configured MySQL database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
            return engine, db_url
        except Exception as e:
            logger.warning(f"Failed to authenticate with configured MySQL ({e}). Using local database.")
    
    logger.info(f"Using local development database: {settings.SQLITE_FALLBACK_URL}")
    fallback_engine = create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False}
    )
    return fallback_engine, settings.SQLITE_FALLBACK_URL

engine, active_db_url = get_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

