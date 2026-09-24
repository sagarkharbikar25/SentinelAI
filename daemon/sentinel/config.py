import os
from pathlib import Path

# SentinelAI Base Directory
SENTINEL_HOME = Path(os.getenv("SENTINEL_HOME", Path.home() / ".sentinelai")).expanduser().resolve()

# Directories
MANIFESTS_DIR = SENTINEL_HOME / "manifests"
POLICIES_DIR = SENTINEL_HOME / "policies"
SHIMS_DIR = SENTINEL_HOME / "shims"
CHECKPOINTS_DIR = SENTINEL_HOME / "checkpoints"
VAULT_DIR = SENTINEL_HOME / "vault"

# Database
DB_PATH = SENTINEL_HOME / "sentinel.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Daemon Network Config
DAEMON_HOST = os.getenv("SENTINEL_HOST", "127.0.0.1")
DAEMON_PORT = int(os.getenv("SENTINEL_PORT", "8765"))

# Security & Circuit Breaker Defaults
PROMPT_TIMEOUT_SECONDS = int(os.getenv("SENTINEL_PROMPT_TIMEOUT", "30"))
BURST_DELETES_PER_60S = 10
BURST_WRITES_PER_60S = 50

# Ensure directories exist
def init_sentinel_directories():
    for directory in [SENTINEL_HOME, MANIFESTS_DIR, POLICIES_DIR, SHIMS_DIR, CHECKPOINTS_DIR, VAULT_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
