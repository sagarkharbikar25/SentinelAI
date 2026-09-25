import asyncio
import json
import re
import tomllib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

from sentinel.api.schemas import (
    ActionLogItem,
    CreatePolicyRequest,
    DaemonStatusResponse,
    EndSessionRequest,
    ExplainRequest,
    ExplainResponse,
    InterceptRequest,
    InterceptResponse,
    PolicyItem,
    StartSessionRequest,
    StartSessionResponse,
    ToolItem,
    UserResponseRequest,
    UserResponseResult,
)
from sentinel.config import MANIFESTS_DIR, POLICIES_DIR, PROMPT_TIMEOUT_SECONDS
from sentinel.core.decision_engine import DecisionEngine, DecisionOutcome
from sentinel.core.llm_explainer import LLMExplainer
from sentinel.core.manifest_checker import ManifestChecker
from sentinel.core.policy_engine import PolicyEngine, create_default_policies
from sentinel.core.risk_scorer import RiskScorer
from sentinel.db.database import get_db
from sentinel.db.models import Action, Alert, AuditLog, Decision, Session as DbSessionModel

router = APIRouter(prefix="/daemon", tags=["Sentinel Daemon"])

# Shared engine instances
policy_engine = PolicyEngine(POLICIES_DIR)
# Seed default policies if missing
create_default_policies(POLICIES_DIR)
policy_engine.load_policies(POLICIES_DIR)

manifest_checker = ManifestChecker()
risk_scorer = RiskScorer()
decision_engine = DecisionEngine(manifest_checker, risk_scorer, policy_engine)
llm_explainer = LLMExplainer()

# In-memory synchronization latch for interactive user prompts
pending_events: Dict[str, asyncio.Event] = {}
user_choices: Dict[str, str] = {}
active_session_id: Optional[str] = None


@router.get("/status", response_model=DaemonStatusResponse)
async def get_status():
    """Health check endpoint for Tauri app and CLI clients."""
    return DaemonStatusResponse(
        running=True,
        version="0.1.0",
        active_session_id=active_session_id,
        circuit_breaker_state="CLOSED",
        vault_size_mb=0.0,
    )


@router.get("/policies", response_model=List[PolicyItem])
async def list_policies():
    policy_engine.load_policies(POLICIES_DIR)
    return [PolicyItem(name=rule.policy_name, scope=rule.path_pattern or "*", action=rule.effect.value) for rule in policy_engine.rules]


@router.post("/policies", response_model=PolicyItem, status_code=201)
async def create_policy(req: CreatePolicyRequest):
    safe_name = re.sub(r"[^a-z0-9]+", "-", req.name.lower()).strip("-") or "policy"
    policy_path = POLICIES_DIR / f"{safe_name}.toml"
    policy_path.write_text(
        f'''[policy]\nname = {json.dumps(req.name)}\ndescription = {json.dumps(req.rule)}\nis_active = true\n\n[[rules]]\nagent_type = "*"\naction_type = "*"\npath_pattern = {json.dumps(req.scope)}\noperation = "*"\neffect = "REQUIRE_CONFIRMATION"\nreason = {json.dumps(req.rule)}\npriority = 100\n''',
        encoding="utf-8",
    )
    policy_engine.load_policies(POLICIES_DIR)
    return PolicyItem(name=req.name, scope=req.scope, action="REQUIRE_CONFIRMATION")


@router.get("/tools", response_model=List[ToolItem])
async def list_tools():
    tools: List[ToolItem] = []
    manifest_dirs = [MANIFESTS_DIR, Path(__file__).resolve().parents[2] / "manifests"]
    manifest_paths = {path for directory in manifest_dirs for path in directory.glob("*.toml")}
    for manifest_path in manifest_paths:
        try:
            with manifest_path.open("rb") as manifest_file:
                manifest = tomllib.load(manifest_file)
            owner = manifest.get("agent", {}).get("name", manifest_path.stem)
            operations = manifest.get("permissions", {}).get("allowed_operations", []) or ["UNSPECIFIED"]
            tools.extend(ToolItem(name=f"{manifest_path.stem}.{operation.lower()}", owner=owner, status="Verified") for operation in operations)
        except (OSError, tomllib.TOMLDecodeError):
            tools.append(ToolItem(name=manifest_path.stem, owner="Unknown", status="Needs review"))
    return tools


@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest, db: DBSession = Depends(get_db)):
    """Starts an agent session with granted scopes."""
    global active_session_id
    new_session = DbSessionModel(
        id=str(uuid4()),
        agent_id=req.agent_id,
        task_description=req.task_description,
        granted_paths=req.granted_paths,
        started_at=datetime.utcnow(),
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    active_session_id = new_session.id

    return StartSessionResponse(
        session_id=new_session.id,
        agent_id=new_session.agent_id,
        task_description=new_session.task_description,
        granted_paths=new_session.granted_paths or [],
        started_at=new_session.started_at.isoformat(),
    )


@router.post("/session/end")
async def end_session(req: EndSessionRequest, db: DBSession = Depends(get_db)):
    """Terminates an active agent session."""
    global active_session_id
    session = db.query(DbSessionModel).filter(DbSessionModel.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()
    db.commit()
    if active_session_id == req.session_id:
        active_session_id = None

    return {"ok": True, "session_id": req.session_id, "ended_at": session.ended_at.isoformat()}


@router.post("/intercept", response_model=InterceptResponse)
async def intercept_action(req: InterceptRequest, db: DBSession = Depends(get_db)):
    """
    Core interception hook called by shell shims, MCP proxy, and file watchers.
    Synchronously resolves or awaits user approval.
    """
    global active_session_id
    current_sess_id = req.session_id or active_session_id

    # Retrieve granted paths from active session if present
    granted_paths: List[str] = []
    if current_sess_id:
        sess = db.query(DbSessionModel).filter(DbSessionModel.id == current_sess_id).first()
        if sess and sess.granted_paths:
            granted_paths = sess.granted_paths

    # 1. Run deterministic decision engine
    decision = decision_engine.decide(
        agent_type=req.agent_type,
        action_type=req.action_type,
        target_path=req.target_path,
        operation=req.operation or "DELETE",
        granted_paths=granted_paths,
    )

    action_id = str(uuid4())
    final_outcome = decision.outcome.value

    # Create Action record
    action_record = Action(
        id=action_id,
        session_id=current_sess_id,
        agent_id=req.agent_id,
        action_type=req.action_type,
        target_path=req.target_path,
        target_url=req.target_url,
        command=req.command,
        risk_score=decision.risk_score,
        file_sensitivity=decision.risk_category.value,
        created_at=datetime.utcnow(),
    )
    db.add(action_record)
    db.commit()

    # 2. If decision is PROMPT_USER, await human feedback via async event
    if decision.outcome == DecisionOutcome.PROMPT_USER:
        event = asyncio.Event()
        pending_events[action_id] = event

        # Also create an Alert for UI
        alert = Alert(
            id=str(uuid4()),
            title=f"Permission Required: {req.operation or 'Action'} on {req.target_path or 'resource'}",
            description=decision.explanation,
            severity=decision.risk_category.value,
            alert_type="HIGH_RISK",
            action_id=action_id,
            is_read=False,
        )
        db.add(alert)
        db.commit()

        try:
            # Wait for user response with 30s timeout
            await asyncio.wait_for(event.wait(), timeout=PROMPT_TIMEOUT_SECONDS)
            user_choice = user_choices.pop(action_id, "BLOCK")
            final_outcome = "USER_ALLOWED" if user_choice == "ALLOW" else "USER_BLOCKED"
        except asyncio.TimeoutError:
            # Safe default on timeout: BLOCK
            final_outcome = "BLOCK"
            decision.reason_code = "PROMPT_TIMEOUT_AUTO_BLOCK"
            decision.explanation += " (User did not respond within 30 seconds. Automatically blocked for safety)."
        finally:
            pending_events.pop(action_id, None)

    # 3. Save decision record
    decision_record = Decision(
        id=str(uuid4()),
        action_id=action_id,
        outcome=final_outcome,
        reason_code=decision.reason_code,
        explanation=decision.explanation,
        decided_at=datetime.utcnow(),
    )
    db.add(decision_record)

    # 4. Append to immutable audit log flight recorder
    audit_log = AuditLog(
        id=str(uuid4()),
        action_id=action_id,
        session_id=current_sess_id,
        agent_id=req.agent_id,
        action_type=req.action_type,
        target_path=req.target_path,
        outcome=final_outcome,
        risk_score=decision.risk_score,
        created_at=datetime.utcnow(),
    )
    db.add(audit_log)
    db.commit()

    # Normalize response for caller (ALLOW vs BLOCK)
    effective_decision = "ALLOW" if final_outcome in ["ALLOW", "USER_ALLOWED"] else "BLOCK"

    return InterceptResponse(
        decision=effective_decision,
        action_id=action_id,
        reason_code=decision.reason_code,
        explanation=decision.explanation,
        risk_score=decision.risk_score,
        risk_category=decision.risk_category.value,
        snapshot_taken=False,
    )


@router.post("/user-response", response_model=UserResponseResult)
async def user_response(req: UserResponseRequest, db: DBSession = Depends(get_db)):
    """Called by Member 1's Tauri prompt dialog when user clicks Allow or Block."""
    action_id = req.action_id
    choice = req.user_choice.upper()

    if action_id not in pending_events:
        # Check if action exists in DB
        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            raise HTTPException(status_code=404, detail="Action not found or prompt already expired")
        return UserResponseResult(
            ok=False,
            action_id=action_id,
            final_outcome="EXPIRED",
            message="Prompt has already expired or resolved",
        )

    # Register choice and unblock waiting intercept handler
    user_choices[action_id] = choice
    pending_events[action_id].set()

    return UserResponseResult(
        ok=True,
        action_id=action_id,
        final_outcome=f"USER_{choice}",
        message=f"Successfully applied user response: {choice}",
    )


@router.get("/actions", response_model=List[ActionLogItem])
async def list_actions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DBSession = Depends(get_db),
):
    """Returns recent intercepted actions for ActivityTimeline UI."""
    actions = (
        db.query(Action)
        .order_by(Action.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for a in actions:
        outcome = a.decision.outcome if a.decision else "PENDING"
        items.append(
            ActionLogItem(
                id=a.id,
                session_id=a.session_id,
                agent_id=a.agent_id,
                action_type=a.action_type,
                target_path=a.target_path,
                outcome=outcome,
                risk_score=a.risk_score,
                created_at=(a.created_at.isoformat() + "Z") if a.created_at else "",
            )
        )
    return items


@router.get("/alerts")
async def list_alerts(
    unread_only: bool = Query(True),
    db: DBSession = Depends(get_db),
):
    """Returns alerts for Member 2's security dashboard."""
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.created_at.desc()).limit(50).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "action_id": a.action_id,
            "is_read": a.is_read,
            "created_at": (a.created_at.isoformat() + "Z") if a.created_at else "",
        }
        for a in alerts
    ]


@router.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, db: DBSession = Depends(get_db)):
    """Marks an alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"ok": True, "alert_id": alert_id}


@router.post("/explain", response_model=ExplainResponse)
async def explain_action(req: ExplainRequest):
    """
    Translates silent background AI agent activities and warnings into plain English
    using local Ollama (e.g., llama3.2:1b, qwen2.5:0.5b, phi3:mini) with a fast heuristic fallback.
    """
    exp = llm_explainer.explain_action(
        agent_id=req.agent_id,
        action_type=req.action_type,
        operation=req.operation,
        target_path=req.target_path,
        risk_score=req.risk_score,
        command=req.command,
    )
    return ExplainResponse(
        provider=exp.provider,
        model_name=exp.model_name,
        silent_activity=exp.silent_activity,
        security_warning=exp.security_warning,
        recommended_action=exp.recommended_action,
        is_llm_powered=exp.is_llm_powered,
    )
