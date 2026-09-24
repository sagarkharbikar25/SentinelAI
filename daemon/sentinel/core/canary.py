"""
SentinelAI Tripwire Canary Module (Semester 5 Foundation)
Manages planting, tracking, and cryptographic integrity verification of honeypot canary files.
"""
from datetime import datetime
import hashlib
import os
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sentinel.db.database import SessionLocal
from sentinel.db.models import Alert, CanaryFile

CANARY_HEADER = b"SENTINELAI_CANARY_TRIPWIRE_V1"


def compute_file_hash(path: Path) -> str:
    """Compute SHA-256 hash of a file's content."""
    sha = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            sha.update(chunk)
    return sha.hexdigest()


class CanaryManager:
    """Manages creation and verification of honeypot canaries."""

    def __init__(self, db: Optional[Session] = None):
        self._owns_session = False
        if db is None:
            self.db = SessionLocal()
            self._owns_session = True
        else:
            self.db = db

    def close(self) -> None:
        if self._owns_session and self.db:
            self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def plant_canary(self, target_path: Path, identifier: Optional[str] = None) -> CanaryFile:
        """
        Plant a canary file at target_path and register it in the database.
        """
        target_path = Path(target_path).expanduser().resolve()
        target_path.parent.mkdir(parents=True, exist_ok=True)

        canary_id = identifier or str(uuid4())
        content = (
            CANARY_HEADER
            + b"\nID="
            + canary_id.encode("utf-8")
            + b"\nCREATED="
            + datetime.utcnow().isoformat().encode("utf-8")
            + b"\nNOTICE=CONFIDENTIAL SECURITY TOKEN - ACCESS RESTRICTED\n"
        )

        with open(target_path, "wb") as f:
            f.write(content)

        file_hash = compute_file_hash(target_path)
        existing = self.db.query(CanaryFile).filter_by(path=str(target_path)).first()

        if existing:
            existing.file_hash = file_hash
            existing.last_verified_at = datetime.utcnow()
            canary_record = existing
        else:
            canary_record = CanaryFile(
                id=canary_id,
                path=str(target_path),
                file_hash=file_hash,
                created_at=datetime.utcnow(),
                last_verified_at=datetime.utcnow(),
            )
            self.db.add(canary_record)

        self.db.commit()
        return canary_record

    def verify_canaries(self) -> List[Dict[str, str]]:
        """
        Verify all registered canary files.
        Returns a list of violation reports (modified or deleted).
        """
        canaries = self.db.query(CanaryFile).all()
        violations = []

        for canary in canaries:
            canary_path = Path(canary.path)

            if not canary_path.exists():
                violations.append({
                    "id": canary.id,
                    "path": canary.path,
                    "status": "MISSING_DELETED",
                    "reason": "Canary file has been deleted or moved.",
                })
                self._record_canary_alert(canary.path, "DELETED")
                continue

            current_hash = compute_file_hash(canary_path)
            if current_hash != canary.file_hash:
                violations.append({
                    "id": canary.id,
                    "path": canary.path,
                    "status": "MODIFIED_TAMPERED",
                    "reason": "Canary content hash mismatch — file has been altered.",
                })
                self._record_canary_alert(canary.path, "MODIFIED")
            else:
                canary.last_verified_at = datetime.utcnow()

        self.db.commit()
        return violations

    def _record_canary_alert(self, path: str, violation_type: str) -> None:
        """Trigger an immediate CRITICAL alert when a canary is disturbed."""
        alert = Alert(
            id=str(uuid4()),
            title=f"CANARY TRIPWIRE TRIGGERED: {violation_type}",
            description=f"Honeypot canary at '{path}' was {violation_type.lower()}. Potential agent escape or credential harvesting detected.",
            severity="CRITICAL",
            alert_type="CANARY",
            is_read=False,
        )
        self.db.add(alert)
