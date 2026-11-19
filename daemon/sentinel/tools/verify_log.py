"""
SentinelAI Anti-Tamper Log Verification Tool.
Traverses the cryptographic hash chain of audit_logs from genesis to head,
re-evaluates SHA-256 hashes, and pinpoints any row that was modified, inserted, or broken.
"""
import sys
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from sentinel.core.hash_chain import GENESIS_HASH, canonical_serialize, compute_row_hash
from sentinel.db.database import SessionLocal


def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Verifies cryptographic continuity of all audit_logs records.
    Returns dictionary with verification status and details.
    """
    # Fetch all records ordered chronologically
    rows = db.execute(
        text(
            """
            SELECT id, action_id, session_id, agent_id, action_type,
                   target_path, outcome, risk_score, file_diff_hash,
                   ip_address, created_at, prev_hash, row_hash
            FROM audit_logs
            ORDER BY created_at ASC, rowid ASC
            """
        )
    ).mappings().all()

    if not rows:
        return {"valid": True, "count": 0, "head_hash": GENESIS_HASH, "message": "Log is empty (Genesis state)"}

    expected_prev = GENESIS_HASH

    for idx, row in enumerate(rows):
        row_id = row["id"]
        row_prev = row["prev_hash"]
        row_hash = row["row_hash"]

        # 1. Verify previous hash continuity
        if row_prev != expected_prev:
            return {
                "valid": False,
                "count": len(rows),
                "broken_at_index": idx,
                "tampered_row_id": row_id,
                "error": "PREV_HASH_MISMATCH",
                "message": f"Hash chain broken at index {idx} (row {row_id}). Expected prev_hash {expected_prev}, got {row_prev}",
            }

        # 2. Recompute canonical payload and SHA-256
        data_to_hash = {
            "id": row["id"],
            "action_id": row["action_id"],
            "session_id": row["session_id"],
            "agent_id": row["agent_id"],
            "action_type": row["action_type"],
            "target_path": row["target_path"],
            "outcome": row["outcome"],
            "risk_score": row["risk_score"],
            "file_diff_hash": row["file_diff_hash"],
            "ip_address": row["ip_address"],
            "created_at": row["created_at"],
        }
        canonical_str = canonical_serialize(data_to_hash)
        expected_current = compute_row_hash(expected_prev, canonical_str)

        if row_hash != expected_current:
            return {
                "valid": False,
                "count": len(rows),
                "broken_at_index": idx,
                "tampered_row_id": row_id,
                "error": "ROW_HASH_MISMATCH",
                "message": f"Cryptographic integrity failed at index {idx} (row {row_id}). Row payload was altered after signature.",
            }

        expected_prev = row_hash

    return {
        "valid": True,
        "count": len(rows),
        "head_hash": expected_prev,
        "message": f"Successfully verified {len(rows)} audit log records. Chain integrity 100% valid.",
    }


def main():
    """CLI entrypoint for log verification."""
    db = SessionLocal()
    try:
        result = verify_audit_chain(db)
        if result["valid"]:
            print(f"\033[32m[PASS] {result['message']}\033[0m")
            print(f"Chain Head: {result.get('head_hash')}")
            sys.exit(0)
        else:
            print(f"\033[31m[TAMPER DETECTED] {result['message']}\033[0m")
            print(f"Altered Record ID: {result.get('tampered_row_id')}")
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
