import fnmatch
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import List, Optional


class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class RiskScore:
    score: int
    category: RiskCategory
    reasons: List[str] = field(default_factory=list)
    is_git_tracked: bool = False
    is_in_scope: bool = True
    file_size_bytes: int = 0


class RiskScorer:
    """
    Deterministic path and file metadata risk scorer (0-100 scale).
    No ML, no randomness. Always consistent.
    """

    CRITICAL_PATTERNS = [
        "~/.ssh/**",
        "~/.ssh/*",
        "~/.env*",
        "**/.env*",
        "~/.gnupg/**",
        "~/.aws/**",
        "~/.kube/**",
        "~/.docker/**",
        "**/id_rsa*",
        "**/id_ed25519*",
    ]

    def score(
        self,
        path_str: Optional[str],
        operation: str,
        granted_paths: Optional[List[str]] = None,
        is_git_tracked: Optional[bool] = None,
    ) -> RiskScore:
        score = 0
        reasons: List[str] = []
        in_scope = True
        file_size = 0

        if not path_str:
            # Operation with no path (e.g., bare shell command)
            base_score = 30 if operation == "EXECUTE" else 10
            return RiskScore(
                score=base_score,
                category=self.categorize(base_score),
                reasons=["Generic operation with no target path specified"],
                is_git_tracked=False,
                is_in_scope=True,
            )

        resolved_path = Path(path_str).expanduser().resolve()
        norm_str = str(resolved_path).replace("\\", "/")

        # Check existing file size
        if resolved_path.exists() and resolved_path.is_file():
            try:
                file_size = resolved_path.stat().st_size
            except OSError:
                file_size = 0

        # 1. Critical path check
        if self._is_critical(norm_str):
            score += 50
            reasons.append("Path matches sensitive credential or secret patterns (.ssh, .env, etc.)")

        # 2. Scope check against session granted paths
        if granted_paths is not None:
            if not self._is_in_granted_scope(norm_str, granted_paths):
                score += 40
                in_scope = False
                reasons.append("Target path is outside session-granted boundaries")
            else:
                reasons.append("Target path is within session-granted scope")

        # 3. Git tracking check
        if is_git_tracked is None:
            is_git_tracked = self._detect_git_tracked(resolved_path)

        if is_git_tracked:
            score = max(0, score - 10)
            reasons.append("File is tracked in version control (revertible via git)")
        else:
            score += 20
            reasons.append("File is untracked (potential permanent loss if deleted)")

        # 4. Recent user modification check (< 10 minutes)
        if self._was_recently_edited(resolved_path, minutes=10):
            score += 15
            reasons.append("File was recently edited within the last 10 minutes")

        # 5. Operation multiplier
        op_upper = operation.upper()
        if "DELETE" in op_upper or op_upper == "RM":
            score = min(100, int((score + 15) * 1.5))
            reasons.append("Operation is destructive DELETE (highest severity)")
        elif "EXECUTE" in op_upper or "SHELL" in op_upper:
            score = min(100, score + 20)
            reasons.append("Operation is arbitrary EXECUTE")

        # Cap between 0 and 100
        final_score = max(0, min(100, score))
        category = self.categorize(final_score)

        return RiskScore(
            score=final_score,
            category=category,
            reasons=reasons,
            is_git_tracked=is_git_tracked,
            is_in_scope=in_scope,
            file_size_bytes=file_size,
        )

    def categorize(self, score: int) -> RiskCategory:
        if score <= 30:
            return RiskCategory.LOW
        elif score <= 60:
            return RiskCategory.MEDIUM
        elif score <= 85:
            return RiskCategory.HIGH
        else:
            return RiskCategory.CRITICAL

    def _is_critical(self, norm_path: str) -> bool:
        for pattern in self.CRITICAL_PATTERNS:
            exp_pattern = str(Path(pattern).expanduser()).replace("\\", "/")
            if fnmatch.fnmatch(norm_path, exp_pattern):
                return True
            if exp_pattern.endswith("/**"):
                base = exp_pattern[:-3]
                if norm_path == base or norm_path.startswith(base + "/"):
                    return True
        return False

    def _is_in_granted_scope(self, norm_path: str, granted_paths: List[str]) -> bool:
        for granted in granted_paths:
            exp_granted = str(Path(granted).expanduser().resolve()).replace("\\", "/")
            if norm_path == exp_granted or norm_path.startswith(exp_granted + "/"):
                return True
            if fnmatch.fnmatch(norm_path, exp_granted) or fnmatch.fnmatch(norm_path, exp_granted + "/*"):
                return True
        return False

    def _detect_git_tracked(self, file_path: Path) -> bool:
        """Best-effort check if file is tracked by git without hard dependency."""
        current = file_path.parent
        while current != current.parent:
            if (current / ".git").exists():
                # Within a git directory
                # Check for GitPython or git command if available, else assume tracked if in git repo
                try:
                    import subprocess
                    result = subprocess.run(
                        ["git", "ls-files", "--error-unmatch", str(file_path)],
                        cwd=str(current),
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    return result.returncode == 0
                except Exception:
                    return True
            current = current.parent
        return False

    def _was_recently_edited(self, file_path: Path, minutes: int = 10) -> bool:
        try:
            if file_path.exists():
                mtime = file_path.stat().st_mtime
                return (time.time() - mtime) < (minutes * 60)
        except OSError:
            pass
        return False
