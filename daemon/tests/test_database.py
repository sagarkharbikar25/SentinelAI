import hashlib
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sentinel.core.canary import CanaryManager
from sentinel.db.models import (
    Action,
    Agent,
    Alert,
    AuditLog,
    Base,
    CanaryFile,
    Decision,
    Policy,
    PolicyRule,
    Session as DbSession,
    Snapshot,
    VaultEntry,
)
from sentinel.db.seed import seed_database


@pytest.fixture
def test_db(tmp_path):
    """Create an isolated temporary SQLite database for unit tests."""
    db_path = tmp_path / "test_sentinel.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_models_crud_and_relationships(test_db):
    """Test creation and relationship navigation across SentinelAI database models."""
    # 1. Create Agent
    agent = Agent(
        id=str(uuid4()),
        name="Test Coding Agent",
        agent_type="MCP",
        status="ACTIVE",
    )
    test_db.add(agent)
    test_db.commit()

    # 2. Create Session
    session = DbSession(
        id=str(uuid4()),
        agent_id=agent.id,
        task_description="Refactor database schema",
        granted_paths=["/tmp/project"],
    )
    test_db.add(session)
    test_db.commit()

    # 3. Create Action
    action = Action(
        id=str(uuid4()),
        session_id=session.id,
        agent_id=agent.id,
        action_type="FILE_DELETE",
        target_path="/tmp/project/old_file.py",
        risk_score=75,
        file_sensitivity="HIGH",
    )
    test_db.add(action)
    test_db.commit()

    # 4. Create Decision
    decision = Decision(
        id=str(uuid4()),
        action_id=action.id,
        outcome="BLOCK",
        reason_code="HIGH_RISK_SENSITIVE",
        explanation="Deletion of critical file outside verified sandbox is blocked.",
    )
    test_db.add(decision)
    test_db.commit()

    # 5. Create Vault Entry & Snapshot
    vault = VaultEntry(
        id=str(uuid4()),
        action_id=action.id,
        original_path="/tmp/project/old_file.py",
        vault_path="/tmp/vault/old_file.py.bak",
        file_hash=hashlib.sha256(b"content").hexdigest(),
        file_size_bytes=1024,
    )
    snapshot = Snapshot(
        id=str(uuid4()),
        session_id=session.id,
        action_id=action.id,
        commit_hash="a1b2c3d4e5f6",
        snapshot_type="GIT_CHECKPOINT",
    )
    test_db.add_all([vault, snapshot])
    test_db.commit()

    # Verify relationships
    queried_action = test_db.query(Action).filter_by(id=action.id).first()
    assert queried_action is not None
    assert queried_action.decision.outcome == "BLOCK"
    assert queried_action.agent.name == "Test Coding Agent"
    assert len(queried_action.vault_entries) == 1
    assert queried_action.vault_entries[0].vault_path == "/tmp/vault/old_file.py.bak"
    assert queried_action.session.task_description == "Refactor database schema"


def test_policy_and_rules_cascade(test_db):
    """Test policy model and cascaded policy rules."""
    policy = Policy(
        id=str(uuid4()),
        name="Test Sandboxing Policy",
        description="Enforces strict isolation.",
    )
    test_db.add(policy)
    test_db.flush()

    rule1 = PolicyRule(
        id=str(uuid4()),
        policy_id=policy.id,
        path_pattern="**/.git/**",
        effect="DENY",
        reason="Git internal directory is protected.",
        priority=100,
    )
    rule2 = PolicyRule(
        id=str(uuid4()),
        policy_id=policy.id,
        path_pattern="**/build/**",
        effect="REQUIRE_CONFIRMATION",
        reason="Build artifacts require confirmation.",
        priority=50,
    )
    test_db.add_all([rule1, rule2])
    test_db.commit()

    queried_policy = test_db.query(Policy).filter_by(name="Test Sandboxing Policy").first()
    assert len(queried_policy.rules) == 2
    assert {r.effect for r in queried_policy.rules} == {"DENY", "REQUIRE_CONFIRMATION"}


def test_seed_database_execution(test_db):
    """Test seed_database runs idempotently and populates defaults."""
    seed_database(db=test_db)

    agents = test_db.query(Agent).all()
    assert len(agents) >= 3
    names = {a.name for a in agents}
    assert "Claude Code" in names
    assert "Cursor" in names

    policies = test_db.query(Policy).all()
    assert len(policies) >= 3
    policy_names = {p.name for p in policies}
    assert "Protect Secrets" in policy_names
    assert "No System Modification" in policy_names

    # Run seed again to verify idempotency
    seed_database(db=test_db)
    agents_after = test_db.query(Agent).all()
    assert len(agents_after) == len(agents)


def test_canary_manager_planting_and_verification(test_db, tmp_path):
    """Test CanaryManager plants canaries, detects modifications, and detects deletion."""
    manager = CanaryManager(db=test_db)
    canary_file = tmp_path / "tripwire" / ".sentinel_canary"

    # 1. Plant Canary
    record = manager.plant_canary(canary_file)
    assert canary_file.exists()
    assert record.path == str(canary_file.resolve())

    # 2. Verify clean state
    violations = manager.verify_canaries()
    assert len(violations) == 0

    # 3. Tamper with canary
    canary_file.write_bytes(b"TAMPERED_CONTENT_BY_ROGUE_AGENT")
    violations = manager.verify_canaries()
    assert len(violations) == 1
    assert violations[0]["status"] == "MODIFIED_TAMPERED"

    # Verify alert was created
    alerts = test_db.query(Alert).filter_by(alert_type="CANARY").all()
    assert len(alerts) >= 1
    assert alerts[-1].severity == "CRITICAL"

    # 4. Delete canary
    canary_file.unlink()
    violations_missing = manager.verify_canaries()
    assert any(v["status"] == "MISSING_DELETED" for v in violations_missing)
