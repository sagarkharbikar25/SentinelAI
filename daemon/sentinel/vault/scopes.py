"""
SentinelAI Watched Scope & Exclusion Filter.
Manages protected backup zones and default exclusions (.git, node_modules, caches, venv).
"""
import fnmatch
from pathlib import Path
from typing import List, Union

DEFAULT_EXCLUDED_PATTERNS = [
    "**/node_modules/**",
    "**/.git/**",
    "**/venv/**",
    "**/.venv/**",
    "**/__pycache__/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/target/**",
    "**/.cache/**",
    "**/*.pyc",
    "**/*.tmp",
]


def is_excluded(path: Union[str, Path], custom_exclusions: List[str] = None) -> bool:
    """Checks whether a given path falls into excluded directories or file types."""
    norm_path = str(Path(path).expanduser().resolve()).replace("\\", "/")
    patterns = list(DEFAULT_EXCLUDED_PATTERNS)
    if custom_exclusions:
        patterns.extend(custom_exclusions)

    for pat in patterns:
        norm_pat = pat.replace("\\", "/")
        if fnmatch.fnmatch(norm_path, norm_pat) or fnmatch.fnmatch(norm_path, f"*/{norm_pat}/*"):
            return True
        # Check segment containment e.g. /node_modules/
        clean_pat = norm_pat.replace("**/", "").replace("/**", "").strip("*")
        if f"/{clean_pat}/" in norm_path or norm_path.endswith(f"/{clean_pat}"):
            return True

    return False


def is_in_watched_scope(path: Union[str, Path], watched_scopes: List[str]) -> bool:
    """Checks whether a given path is covered by any registered watched scope."""
    if not watched_scopes:
        return False
    norm_path = str(Path(path).expanduser().resolve()).replace("\\", "/")
    for scope in watched_scopes:
        norm_scope = str(Path(scope).expanduser().resolve()).replace("\\", "/")
        if norm_path == norm_scope or norm_path.startswith(norm_scope + "/"):
            return True
    return False
