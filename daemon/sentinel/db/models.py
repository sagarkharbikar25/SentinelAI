from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    agent_type = Column(String(50), nullable=False, default="MCP")  # MCP | SHELL | SCRIPT | BROWSER
    manifest_path = Column(String(1024), nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE | SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="agent", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="agent")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    task_description = Column(String(1024), nullable=True)
    granted_paths = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    checkpoint_commit = Column(String(40), nullable=True)

    agent = relationship("Agent", back_populates="sessions")
    actions = relationship("Action", back_populates="session", cascade="all, delete-orphan")


class Action(Base):
    __tablename__ = "actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    action_type = Column(String(50), nullable=False)  # FILE_DELETE, FILE_WRITE, SHELL_CMD, etc.
    target_path = Column(String(1024), nullable=True)
    target_url = Column(String(2048), nullable=True)
    command = Column(Text, nullable=True)
    risk_score = Column(Integer, default=0)
    file_sensitivity = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    was_snapshotted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    agent = relationship("Agent", back_populates="actions")
    session = relationship("Session", back_populates="actions")
    decision = relationship("Decision", back_populates="action", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_actions_session_id", "session_id"),
        Index("idx_actions_created_at", "created_at"),
        Index("idx_actions_action_type", "action_type"),
    )


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    action_id = Column(String(36), ForeignKey("actions.id"), unique=True, nullable=False)
    outcome = Column(String(20), nullable=False)  # ALLOW, PROMPT_USER, BLOCK, USER_ALLOWED, USER_BLOCKED
    reason_code = Column(String(50), nullable=True)
    explanation = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.utcnow)
    user_responded_at = Column(DateTime, nullable=True)

    action = relationship("Action", back_populates="decision")

    __table_args__ = (
        Index("idx_decisions_outcome", "outcome"),
    )


class AuditLog(Base):
    """
    Append-only flight recorder log.
    Strictly records every intercepted operation and outcome.
    Never update or delete records here.
    """
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    action_id = Column(String(36), nullable=False)
    session_id = Column(String(36), nullable=True)
    agent_id = Column(String(36), nullable=True)
    action_type = Column(String(50), nullable=False)
    target_path = Column(String(1024), nullable=True)
    outcome = Column(String(20), nullable=False)
    risk_score = Column(Integer, default=0)
    file_diff_hash = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_audit_created_at", "created_at"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM")  # LOW | MEDIUM | HIGH | CRITICAL
    alert_type = Column(String(50), nullable=False)  # POLICY_VIOLATION | HIGH_RISK | BLAST_RADIUS | CANARY
    action_id = Column(String(36), ForeignKey("actions.id"), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
