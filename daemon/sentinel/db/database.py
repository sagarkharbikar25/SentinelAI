from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sentinel.config import DATABASE_URL, init_sentinel_directories
from sentinel.db.models import Base

# Ensure ~/.sentinelai directories exist before binding DB
init_sentinel_directories()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite in FastAPI multi-threading
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all SQLite tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
