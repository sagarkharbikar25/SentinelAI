from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sentinel.config import DATABASE_URL, init_sentinel_directories
from sentinel.db.models import Base

# Ensure ~/.sentinelai directories exist before binding DB
init_sentinel_directories()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite in FastAPI multi-threading
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable SQLite WAL mode, foreign keys, and optimized synchronization."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all SQLite tables if they do not exist and ensure WAL mode."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
        conn.exec_driver_sql("PRAGMA foreign_keys=ON;")
        # Auto-migrate columns if tables existed prior to model updates
        for col, col_type in [("prev_hash", "VARCHAR(64)"), ("row_hash", "VARCHAR(64)")]:
            try:
                conn.exec_driver_sql(f"ALTER TABLE audit_logs ADD COLUMN {col} {col_type};")
            except Exception:
                pass


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
