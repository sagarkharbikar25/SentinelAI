import os
import sys
import tempfile
from pathlib import Path


def _is_writable(path: Path) -> bool:
    try:
        path.mkdir(parents=True, exist_ok=True)
        test_file = path / ".test_write"
        test_file.write_text("test")
        test_file.unlink()
        return True
    except (PermissionError, OSError):
        return False


def _resolve_sentinel_home() -> Path:
    env_home = os.getenv("SENTINEL_HOME")
    if env_home:
        p = Path(env_home).expanduser().resolve()
        if _is_writable(p):
            return p

    # Try standard user home directory
    default_home = (Path.home() / ".sentinelai").expanduser().resolve()
    if _is_writable(default_home):
        return default_home

    # Fallback to local workspace or tempdir if user home is restricted
    cwd_home = (Path.cwd() / ".sentinelai").resolve()
    if _is_writable(cwd_home):
        return cwd_home

    temp_home = (Path(tempfile.gettempdir()) / ".sentinelai").resolve()
    temp_home.mkdir(parents=True, exist_ok=True)
    return temp_home


# SentinelAI Base Directory
SENTINEL_HOME = _resolve_sentinel_home()

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
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except (PermissionError, OSError):
            pass
