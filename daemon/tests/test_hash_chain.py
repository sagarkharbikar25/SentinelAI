import datetime
from uuid import uuid4
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import sessionmaker

from sentinel.core.hash_chain import (
    GENESIS_HASH,
    HashChainManager,
    canonical_serialize,
    compute_row_hash,
)
from sentinel.db.models import AuditLog, Base
from sentinel.tools.verify_log import verify_audit_chain


@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_canonical_serialization_is_deterministic():
    data1 = {"b": 2, "a": 1, "c": "test"}
    data2 = {"c": "test", "a": 1, "b": 2}
    assert canonical_serialize(data1) == canonical_serialize(data2)


def test_hash_chain_sequential_linking(memory_db):
    manager = HashChainManager(memory_db)
    manager.install_anti_tamper_triggers()

    # Insert 3 chained records
    prev_h = GENESIS_HASH
    for i in range(3):
        log_id = str(uuid4())
        created = datetime.datetime(2026, 1, 1, 12, i, 0)
        data = {
            "id": log_id,
            "action_id": f"act-{i}",
            "session_id": "sess-1",
            "agent_id": "claude-code",
            "action_type": "FILE_WRITE",
            "target_path": f"/tmp/file_{i}.txt",
            "outcome": "ALLOW",
            "risk_score": 10 * i,
            "file_diff_hash": None,
            "ip_address": "127.0.0.1",
            "created_at": created,
        }
        prev_h, row_h = manager.calculate_chain_hashes(data, explicit_prev_hash=prev_h)
        log_entry = AuditLog(**data, prev_hash=prev_h, row_hash=row_h)
        memory_db.add(log_entry)
        memory_db.commit()
        prev_h = row_h

    # Verify chain
    result = verify_audit_chain(memory_db)
    assert result["valid"] is True
    assert result["count"] == 3
    assert result["head_hash"] == prev_h


def test_anti_tamper_trigger_blocks_update_and_delete(memory_db):
    manager = HashChainManager(memory_db)
    manager.install_anti_tamper_triggers()

    # Insert an entry
    log_id = str(uuid4())
    log = AuditLog(
        id=log_id,
        action_id="act-1",
        action_type="FILE_DELETE",
        outcome="BLOCK",
        prev_hash=GENESIS_HASH,
        row_hash="abcd" * 16,
    )
    memory_db.add(log)
    memory_db.commit()

    # Attempt direct SQL UPDATE on audit_logs
    with pytest.raises((OperationalError, IntegrityError)) as exc_update:
        memory_db.execute(
            text(f"UPDATE audit_logs SET outcome = 'ALLOW' WHERE id = '{log_id}'")
        )
        memory_db.commit()
    assert "Tamper-Evident Log Violation: UPDATE not permitted" in str(exc_update.value)

    # Attempt direct SQL DELETE on audit_logs
    with pytest.raises((OperationalError, IntegrityError)) as exc_delete:
        memory_db.execute(text(f"DELETE FROM audit_logs WHERE id = '{log_id}'"))
        memory_db.commit()
    assert "Tamper-Evident Log Violation: DELETE not permitted" in str(exc_delete.value)


def test_verify_log_catches_forged_record(memory_db):
    manager = HashChainManager(memory_db)

    # Insert legitimate log 1
    log1 = AuditLog(
        id="row-1",
        action_id="act-1",
        action_type="FILE_READ",
        outcome="ALLOW",
        risk_score=0,
        created_at=datetime.datetime(2026, 1, 1, 10, 0, 0),
    )
    data1 = {
        "id": "row-1",
        "action_id": "act-1",
        "session_id": None,
        "agent_id": None,
        "action_type": "FILE_READ",
        "target_path": None,
        "outcome": "ALLOW",
        "risk_score": 0,
        "file_diff_hash": None,
        "ip_address": None,
        "created_at": log1.created_at,
    }
    prev1, hash1 = manager.calculate_chain_hashes(data1, explicit_prev_hash=GENESIS_HASH)
    log1.prev_hash = prev1
    log1.row_hash = hash1
    memory_db.add(log1)
    memory_db.commit()

    # Insert tampered log 2 (row_hash doesn't match recomputed payload)
    log2 = AuditLog(
        id="row-2",
        action_id="act-2",
        action_type="FILE_DELETE",
        outcome="ALLOW",  # Forged
        risk_score=90,
        created_at=datetime.datetime(2026, 1, 1, 10, 1, 0),
        prev_hash=hash1,
        row_hash="fake_hash_1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    )
    memory_db.add(log2)
    memory_db.commit()

    # Verify detects tamper at row-2
    result = verify_audit_chain(memory_db)
    assert result["valid"] is False
    assert result["tampered_row_id"] == "row-2"
    assert result["error"] == "ROW_HASH_MISMATCH"
