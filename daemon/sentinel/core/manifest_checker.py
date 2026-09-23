import fnmatch
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any

try:
    import tomllib  # Python 3.11+
except ImportError:
    import tomli as tomllib  # type: ignore


class ManifestCheckResult(str, Enum):
    IN_SCOPE = "IN_SCOPE"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    NEEDS_EVALUATION = "NEEDS_EVALUATION"


class ManifestChecker:
    """
    Validates agent action requests against the agent's declared TOML permission manifest.
    Deterministic, path- and operation-based validation.
    """

    def __init__(self, manifest_dict_or_path: Optional[Any] = None):
        self.agent_name: str = "Unknown"
        self.agent_type: str = "GENERIC"
        self.allowed_paths: List[str] = []
        self.denied_paths: List[str] = []
        self.allowed_ops: List[str] = []
        self.denied_ops: List[str] = []
        self.limits: Dict[str, Any] = {}

        if manifest_dict_or_path:
            if isinstance(manifest_dict_or_path, (str, Path)):
                self.load_from_file(Path(manifest_dict_or_path))
            elif isinstance(manifest_dict_or_path, dict):
                self.load_from_dict(manifest_dict_or_path)

    def load_from_file(self, path: Path) -> None:
        """Loads and parses a TOML manifest file."""
        expanded_path = path.expanduser().resolve()
        if not expanded_path.exists():
            raise FileNotFoundError(f"Manifest file not found: {expanded_path}")
        with open(expanded_path, "rb") as f:
            data = tomllib.load(f)
        self.load_from_dict(data)

    def load_from_dict(self, data: Dict[str, Any]) -> None:
        """Loads manifest rules from a parsed dictionary."""
        agent_info = data.get("agent", {})
        self.agent_name = agent_info.get("name", "Unknown")
        self.agent_type = agent_info.get("type", "GENERIC")

        permissions = data.get("permissions", {})
        self.allowed_paths = permissions.get("allowed_paths", [])
        self.denied_paths = permissions.get("denied_paths", [])
        self.allowed_ops = permissions.get("allowed_operations", [])
        self.denied_ops = permissions.get("denied_operations", [])
        self.limits = data.get("limits", {})

    def check(self, target_path: Optional[str], operation: str) -> ManifestCheckResult:
        """
        Evaluates whether an action is allowed by the manifest.
        Returns: IN_SCOPE | OUT_OF_SCOPE | NEEDS_EVALUATION
        """
        # If no path is involved (e.g. general command)
        if not target_path:
            if operation in self.denied_ops:
                return ManifestCheckResult.OUT_OF_SCOPE
            if operation in self.allowed_ops:
                return ManifestCheckResult.IN_SCOPE
            return ManifestCheckResult.NEEDS_EVALUATION

        norm_path = str(Path(target_path).expanduser().resolve())

        # 1. Denied paths check (Hard Block)
        if self._matches_any(norm_path, self.denied_paths):
            return ManifestCheckResult.OUT_OF_SCOPE

        # 2. Denied operations check
        if operation in self.denied_ops:
            return ManifestCheckResult.OUT_OF_SCOPE

        # 3. Allowed paths check
        if self._matches_any(norm_path, self.allowed_paths):
            if not self.allowed_ops or operation in self.allowed_ops:
                return ManifestCheckResult.IN_SCOPE
            return ManifestCheckResult.NEEDS_EVALUATION

        # 4. Target path is not covered by any allowed scope
        return ManifestCheckResult.OUT_OF_SCOPE

    def _matches_any(self, path_str: str, patterns: List[str]) -> bool:
        """Matches a normalized path against a list of glob patterns."""
        for pattern in patterns:
            expanded_pattern = str(Path(pattern).expanduser())
            # Normalize slashes for cross-platform comparison
            norm_pat = expanded_pattern.replace("\\", "/")
            norm_tgt = path_str.replace("\\", "/")

            if fnmatch.fnmatch(norm_tgt, norm_pat) or fnmatch.fnmatch(norm_tgt, norm_pat + "/*"):
                return True
            # Handle directory wildcard matching like ~/project/**
            if norm_pat.endswith("/**"):
                base_pat = norm_pat[:-3]
                if norm_tgt == base_pat or norm_tgt.startswith(base_pat + "/"):
                    return True
        return False
