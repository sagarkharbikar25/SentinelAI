"""
SentinelAI Cryptographic Hash Chaining & Anti-Tamper Engine.
Implements append-only SHA-256 hash chaining over the audit log
and registers SQLite triggers that strictly reject manual UPDATE or DELETE.
"""
import hashlib
import json
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def _normalize_value(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, (datetime, str)):
        # Normalize datetimes or datetime strings to standard ISO representation
        if isinstance(v, datetime):
            return v.strftime("%Y-%m-%dT%H:%M:%S")
        if isinstance(v, str) and len(v) >= 19 and (v[10] in (" ", "T")) and v[4] == "-" and v[7] == "-":
            try:
                dt = datetime.fromisoformat(v.replace(" ", "T"))
                return dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError:
                return v
    return v


def canonical_serialize(data: Dict[str, Any]) -> str:
    """Produces deterministic canonical JSON serialization with sorted keys."""
    clean_dict = {}
    for k, v in data.items():
        if k in ["prev_hash", "row_hash"]:
            continue  # Exclude hash fields from the payload being hashed
        clean_dict[k] = _normalize_value(v)
    return json.dumps(clean_dict, sort_keys=True, separators=(",", ":"))


def compute_row_hash(prev_hash: str, canonical_payload: str) -> str:
    """Computes SHA-256(prev_hash || canonical_payload)."""
    hasher = hashlib.sha256()
    hasher.update(prev_hash.encode("utf-8"))
    hasher.update(canonical_payload.encode("utf-8"))
    return hasher.hexdigest()


class HashChainManager:
    """
    Manages cryptographic chaining on audit_logs and enforces
    SQLite database-level immutability triggers.
    """

    def __init__(self, db: Session):
        self.db = db

    def install_anti_tamper_triggers(self) -> None:
        """Installs SQLite BEFORE UPDATE and BEFORE DELETE triggers to abort tampering."""
        update_trigger = """
        CREATE TRIGGER IF NOT EXISTS abort_audit_log_update
        BEFORE UPDATE ON audit_logs
        BEGIN
            SELECT RAISE(FAIL, 'Tamper-Evident Log Violation: UPDATE not permitted on audit_logs table.');
        END;
        """
        delete_trigger = """
        CREATE TRIGGER IF NOT EXISTS abort_audit_log_delete
        BEFORE DELETE ON audit_logs
        BEGIN
            SELECT RAISE(FAIL, 'Tamper-Evident Log Violation: DELETE not permitted on audit_logs table.');
        END;
        """
        self.db.execute(text(update_trigger))
        self.db.execute(text(delete_trigger))
        self.db.commit()

    def get_latest_hash(self) -> str:
        """Retrieves the latest row_hash in the chain, or GENESIS_HASH if empty."""
        result = self.db.execute(
            text("SELECT row_hash FROM audit_logs WHERE row_hash IS NOT NULL ORDER BY created_at DESC, rowid DESC LIMIT 1")
        ).fetchone()
        if result and result[0]:
            return result[0]
        return GENESIS_HASH

    def calculate_chain_hashes(self, log_dict: Dict[str, Any], explicit_prev_hash: Optional[str] = None) -> tuple[str, str]:
        """Calculates (prev_hash, row_hash) for a new audit log record."""
        prev_h = explicit_prev_hash or self.get_latest_hash()
        canonical_str = canonical_serialize(log_dict)
        row_h = compute_row_hash(prev_h, canonical_str)
        return prev_h, row_h
