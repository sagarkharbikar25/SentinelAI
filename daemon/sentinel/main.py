import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sentinel.api.routes import router as daemon_router
from sentinel.config import DAEMON_HOST, DAEMON_PORT, init_sentinel_directories
from sentinel.db.database import init_db
from sentinel.db.seed import seed_database

# 1. Initialize filesystem, SQLite schema, and baseline seed data
init_sentinel_directories()
init_db()
try:
    seed_database()
except Exception:
    pass

# 2. FastAPI Application
app = FastAPI(
    title="SentinelAI Local Security Daemon",
    version="0.1.0",
    description="Local-first permission broker and audit layer for AI agents automating your laptop.",
)

# 3. CORS for Tauri UI & localhost tooling
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:8765",
        "tauri://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include Endpoints
app.include_router(daemon_router)


@app.get("/")
async def root():
    return {
        "service": "SentinelAI Daemon",
        "status": "online",
        "port": DAEMON_PORT,
        "docs_url": "/docs",
    }


def start():
    """CLI runner."""
    uvicorn.run(
        "sentinel.main:app",
        host=DAEMON_HOST,
        port=DAEMON_PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    start()
