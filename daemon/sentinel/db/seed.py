"""
SentinelAI Database Seed Module (Semester 5 Foundation)
Populates the local SQLite database with default agents, policies, rules, and canaries.
"""
import hashlib
from pathlib import Path
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sentinel.db.database import SessionLocal, init_db
from sentinel.db.models import Agent, Alert, AuditLog, CanaryFile, Policy, PolicyRule


def seed_database(db: Optional[Session] = None) -> None:
    """Populate default database entities idempotently."""
    init_db()
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # 1. Seed Default Agents
        default_agents = [
            {
                "id": "agent-claude-code-001",
                "name": "Claude Code",
                "agent_type": "MCP",
                "manifest_path": str(Path.home() / ".sentinelai" / "manifests" / "claude-code.toml"),
                "status": "ACTIVE",
            },
            {
                "id": "agent-cursor-002",
                "name": "Cursor",
                "agent_type": "SCRIPT",
                "manifest_path": str(Path.home() / ".sentinelai" / "manifests" / "cursor.toml"),
                "status": "ACTIVE",
            },
            {
                "id": "agent-shell-003",
                "name": "Interactive Terminal Shell",
                "agent_type": "SHELL",
                "manifest_path": None,
                "status": "ACTIVE",
            },
        ]

        for agent_data in default_agents:
            existing = db.query(Agent).filter_by(name=agent_data["name"]).first()
            if not existing:
                db.add(Agent(**agent_data))

        # 2. Seed Default Security Policies & Rules
        policies_data = [
            {
                "name": "Protect Secrets",
                "description": "Denies all access to private SSH keys, cloud credentials, and environment secret files.",
                "rules": [
                    {
                        "agent_type": None,
                        "action_type": "FILE_DELETE",
                        "path_pattern": "~/.ssh/**",
                        "operation": "DELETE",
                        "effect": "DENY",
                        "reason": "SSH private keys and config are critical credentials.",
                        "priority": 100,
                    },
                    {
                        "agent_type": None,
                        "action_type": "FILE_READ",
                        "path_pattern": "~/.ssh/id_*",
                        "operation": "READ",
                        "effect": "REQUIRE_CONFIRMATION",
                        "reason": "Reading private key requires explicit confirmation.",
                        "priority": 90,
                    },
                    {
                        "agent_type": None,
                        "action_type": "FILE_DELETE",
                        "path_pattern": "**/.env*",
                        "operation": "DELETE",
                        "effect": "DENY",
                        "reason": "Environment files contain API keys and database secrets.",
                        "priority": 100,
                    },
                    {
                        "agent_type": None,
                        "action_type": "FILE_DELETE",
                        "path_pattern": "~/.gnupg/**",
                        "operation": "DELETE",
                        "effect": "DENY",
                        "reason": "GPG keyrings enable signing and encryption.",
                        "priority": 100,
                    },
                ],
            },
            {
                "name": "No System Modification",
                "description": "Prevents accidental or malicious modification of root and system critical directories.",
                "rules": [
                    {
                        "agent_type": None,
                        "action_type": "FILE_DELETE",
                        "path_pattern": "/etc/**",
                        "operation": "DELETE",
                        "effect": "DENY",
                        "reason": "System configuration directory is protected.",
                        "priority": 100,
                    },
                    {
                        "agent_type": None,
                        "action_type": "FILE_DELETE",
                        "path_pattern": "C:\\Windows\\**",
                        "operation": "DELETE",
                        "effect": "DENY",
                        "reason": "Windows operating system files are protected.",
                        "priority": 100,
                    },
                    {
                        "agent_type": None,
                        "action_type": "SHELL_CMD",
                        "path_pattern": None,
                        "operation": "git clean",
                        "effect": "REQUIRE_CONFIRMATION",
                        "reason": "Unfiltered git clean can permanently delete uncommitted workspace files.",
                        "priority": 80,
                    },
                ],
            },
            {
                "name": "Tripwire Canary Defense",
                "description": "Guards honeytokens and canary tripwires planted to detect rogue traversal.",
                "rules": [
                    {
                        "agent_type": None,
                        "action_type": None,
                        "path_pattern": "**/.sentinel_canary",
                        "operation": None,
                        "effect": "DENY",
                        "reason": "Access to tripwire honeypot triggers immediate high-severity lockdown.",
                        "priority": 100,
                    }
                ],
            },
        ]

        for p_data in policies_data:
            existing_p = db.query(Policy).filter_by(name=p_data["name"]).first()
            if not existing_p:
                policy = Policy(
                    id=str(uuid4()),
                    name=p_data["name"],
                    description=p_data["description"],
                    is_active=True,
                )
                db.add(policy)
                db.flush()

                for r_data in p_data["rules"]:
                    rule = PolicyRule(
                        id=str(uuid4()),
                        policy_id=policy.id,
                        agent_type=r_data["agent_type"],
                        action_type=r_data["action_type"],
                        path_pattern=r_data["path_pattern"],
                        operation=r_data["operation"],
                        effect=r_data["effect"],
                        reason=r_data["reason"],
                        priority=r_data["priority"],
                    )
                    db.add(rule)

        # 3. Seed Default Canary Tripwire Records
        canary_paths = [
            str(Path.home() / ".ssh" / ".sentinel_canary"),
            str(Path.home() / ".sentinelai" / "canaries" / "env_vault.canary"),
            str(Path.home() / "Documents" / ".sentinel_canary"),
        ]

        for c_path in canary_paths:
            existing_canary = db.query(CanaryFile).filter_by(path=c_path).first()
            if not existing_canary:
                dummy_hash = hashlib.sha256(f"SENTINEL_CANARY_SEED_{c_path}".encode("utf-8")).hexdigest()
                db.add(
                    CanaryFile(
                        id=str(uuid4()),
                        path=c_path,
                        file_hash=dummy_hash,
                    )
                )

        # 4. Seed Initial Bootstrap Audit & Alert Records
        existing_alert = db.query(Alert).filter_by(title="SentinelAI Shield Online").first()
        if not existing_alert:
            db.add(
                Alert(
                    id=str(uuid4()),
                    title="SentinelAI Shield Online",
                    description="Local security daemon database initialized with Semester 5 security rules and tripwires.",
                    severity="LOW",
                    alert_type="SYSTEM",
                    is_read=False,
                )
            )

        existing_audit = db.query(AuditLog).filter_by(action_type="SYSTEM_INIT").first()
        if not existing_audit:
            db.add(
                AuditLog(
                    id=str(uuid4()),
                    action_id=str(uuid4()),
                    agent_id="agent-claude-code-001",
                    action_type="SYSTEM_INIT",
                    target_path="~/.sentinelai/sentinel.db",
                    outcome="ALLOW",
                    risk_score=0,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_database()
    print("SentinelAI local database seeded successfully.")
