"""
SentinelAI Test Lab Chaos Agent.
Simulates autonomous agent file attacks (T1–T15) and evaluates recovery ground-truth.
"""
import hashlib
import os
import shutil
import time
from pathlib import Path
from typing import Dict, List, Tuple


class ChaosAgent:
    """Simulates destructive filesystem mutations in a controlled test lab folder."""

    def __init__(self, target_dir: Path):
        self.target_dir = Path(target_dir).expanduser().resolve()
        self.target_dir.mkdir(parents=True, exist_ok=True)
        self.ground_truth: Dict[str, str] = {}

    def _hash_file(self, path: Path) -> str:
        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def record_ground_truth(self) -> Dict[str, str]:
        """Scans the target directory and records original SHA-256 hashes."""
        self.ground_truth.clear()
        for root, _, files in os.walk(self.target_dir):
            for f in files:
                p = Path(root) / f
                rel = p.relative_to(self.target_dir).as_posix()
                self.ground_truth[rel] = self._hash_file(p)
        return dict(self.ground_truth)

    def attack_single_file_delete(self, filename: str) -> Path:
        """Deletes a single target file."""
        p = self.target_dir / filename
        if p.exists():
            p.unlink()
        return p

    def attack_file_overwrite(self, filename: str, corrupted_content: bytes = b"MALICIOUS_OVERWRITE") -> Path:
        """Overwrites an existing file with corrupted bytes."""
        p = self.target_dir / filename
        p.write_bytes(corrupted_content)
        return p

    def attack_directory_wipe(self, dirname: str) -> Path:
        """Recursively wipes a directory."""
        p = self.target_dir / dirname
        if p.exists():
            shutil.rmtree(p)
        return p

    def attack_mass_burst_delete(self, file_prefix: str, count: int = 15) -> List[Path]:
        """Triggers a rapid succession of file deletions to trigger burst limiters."""
        deleted: List[Path] = []
        for i in range(count):
            p = self.target_dir / f"{file_prefix}_{i}.tmp"
            p.write_text(f"burst_data_{i}")
            p.unlink()
            deleted.append(p)
        return deleted

    def verify_recovery_rate(self, restored_files_dir: Path) -> Tuple[float, List[str], List[str]]:
        """
        Compares restored directory against original ground truth.
        Returns: (recovery_percentage, recovered_files_list, missing_files_list)
        """
        restored = Path(restored_files_dir).expanduser().resolve()
        recovered: List[str] = []
        missing: List[str] = []

        for rel_path, original_hash in self.ground_truth.items():
            candidate = restored / rel_path
            if candidate.exists() and self._hash_file(candidate) == original_hash:
                recovered.append(rel_path)
            else:
                missing.append(rel_path)

        total = len(self.ground_truth)
        rate = (len(recovered) / total * 100.0) if total > 0 else 100.0
        return rate, recovered, missing
