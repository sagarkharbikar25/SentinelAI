# PLAN-MEMBER3 — Backend Daemon + Interceptors Developer
## SentinelAI Core Security Engine

**Member:** Backend/Daemon Developer  
**Git Branch Prefix:** `feature/daemon-*`  
**Tech Stack:** Python 3.11+ (FastAPI, asyncio, watchdog) + shell shims (Python + bash)  
**Communication Port:** 8765 (IPC), 9999 (MCP proxy), Unix socket (local)

---

## Quick Reference

| Item | Status |
|------|--------|
| **Primary Responsibility** | Python daemon, MCP proxy, shell shims, core decision engine, risk scoring, policy evaluation, circuit breaker |
| **Secondary** | File watcher, vault manager (with M4), snapshot manager, optional LLM explainer |
| **Semester 5 Deliverables** | Daemon + shims + permission checker + risk scorer + policy engine + decision engine |
| **Semester 6 Deliverables** | Circuit breaker + canary system + vault + snapshots + MCP proxy |
| **Semester 7 Deliverables** | Optional LLM integration + latency optimization + full integration test |
| **Research Contribution** | Collect latency metrics, block rate data, false positive logs |

---

## Your Modules & Responsibilities

```
SentinelAI Daemon (Python, Port 8765)
├── FastAPI IPC Server
│   ├── /daemon/intercept (decision engine entry point)
│   ├── /daemon/user-response
│   ├── /daemon/session/{start, end, undo}
│   ├── /daemon/vault/{get, restore}
│   ├── /daemon/actions
│   ├── /daemon/alerts
│   ├── /daemon/status
│   └── (all endpoints Tauri app calls)
│
├── Core Decision Engine
│   ├── Permission manifest checker
│   ├── File risk scorer (deterministic)
│   ├── Policy engine (rule matching)
│   ├── Blast-radius circuit breaker
│   └── Final decision logic
│
├── Interceptors
│   ├── Shell shim receiver (listen for events from rm, mv, cp shims)
│   ├── MCP proxy (intercept tool calls on port 9999)
│   ├── File watcher (watchdog events)
│   └── Browser extension receiver (localhost:8765/daemon/browser-event)
│
├── Support Systems
│   ├── Vault manager (soft-delete, encrypt, recover)
│   ├── Session checkpoint manager (shadow git)
│   ├── Flight recorder (append-only audit log)
│   ├── Canary file manager
│   └── Explainability (template + optional LLM)
│
└── Data Layer
    ├── SQLAlchemy ORM models
    ├── Async SQLite driver
    └── Migrations (Alembic)

Shell Shims (Python, in PATH)
├── rm — wrapper that calls daemon before deleting
├── mv — wrapper that calls daemon before moving
├── cp — wrapper that calls daemon before copying
├── chmod — wrapper for permission changes
├── git-clean-wrapper — hooks `git clean -fd`
└── install_shims.sh — sets up PATH
```

---

## Semester 5 — Foundation Phase (Your Deliverables)

### Phase 1: Research & Architecture (Weeks 1–3)

**Your Tasks:**
- [ ] Research: permission brokers, system call interception, audit systems
  - [ ] Study: strace, seccomp, AppArmor, eBPF (background only — out of scope)
  - [ ] Focus: How do tools intercept OS calls without a kernel module?
  - [ ] Shell shims: study existing wrappers (rg shim, cargo shim, etc.)
- [ ] Draft daemon architecture: modules, data flow, error handling
- [ ] Draft IPC contract with M1: all FastAPI endpoints, request/response shapes
- [ ] Identify Python dependencies (FastAPI, watchdog, GitPython, SQLAlchemy)
  - Test them on your machine (ensure versions work)

**Deliverable:** Architecture doc + IPC contract finalized + dependency list

---

### Phase 2: Setup & Scaffolding (Weeks 4–5)

**Your Tasks:**
- [ ] Create Python daemon project structure
  ```bash
  mkdir sentinel-ai/daemon
  cd daemon
  python3.11 -m venv venv
  source venv/bin/activate
  pip install fastapi uvicorn asyncio-contextmanager watchdog gitpython sqlalchemy python-multipart
  ```
- [ ] Create daemon directory structure
  ```
  daemon/
  ├── sentinel/
  │   ├── api/
  │   │   ├── __init__.py
  │   │   └── routes.py (all endpoints)
  │   ├── core/
  │   │   ├── __init__.py
  │   │   ├── decision_engine.py
  │   │   ├── risk_scorer.py
  │   │   ├── policy_engine.py
  │   │   ├── circuit_breaker.py
  │   │   ├── manifest_checker.py
  │   │   └── explainer.py
  │   ├── interceptors/
  │   │   ├── __init__.py
  │   │   ├── shim_receiver.py
  │   │   ├── mcp_proxy.py
  │   │   ├── file_watcher.py
  │   │   └── browser_event_handler.py
  │   ├── vault/
  │   │   ├── __init__.py
  │   │   ├── vault_manager.py
  │   │   └── snapshot_manager.py
  │   ├── db/
  │   │   ├── __init__.py
  │   │   ├── models.py
  │   │   ├── database.py (SQLAlchemy session)
  │   │   └── migrations/ (Alembic)
  │   ├── config.py (settings, paths)
  │   ├── logger.py (structured logging)
  │   └── main.py (daemon entry point)
  ├── shims/
  │   ├── rm.py
  │   ├── mv.py
  │   ├── cp.py
  │   ├── chmod.py
  │   └── install_shims.sh
  ├── tests/
  ├── requirements.txt
  └── pyproject.toml
  ```
- [ ] Test basic FastAPI server runs
  ```bash
  python -m uvicorn sentinel.main:app --host 127.0.0.1 --port 8765
  ```
- [ ] Confirm M1 can call daemon via IPC (simple GET /daemon/status)

**Deliverable:** Daemon scaffolding compiles, endpoints registered, basic health check works

---

### Phase 3: Core Modules — Priority 1 (Weeks 6–8)

#### Module 1: Permission Manifest Checker

**`sentinel/core/manifest_checker.py`**

```python
class ManifestChecker:
    def __init__(self, manifest_path: Path):
        self.manifest = tomllib.loads(manifest_path.read_text())
        self.allowed_paths = self.manifest["permissions"]["allowed_paths"]
        self.denied_paths = self.manifest["permissions"]["denied_paths"]
        self.allowed_ops = self.manifest["permissions"]["allowed_operations"]
        self.denied_ops = self.manifest["permissions"]["denied_operations"]

    def check(self, path: str, operation: str) -> ManifestCheckResult:
        """
        Returns: IN_SCOPE | OUT_OF_SCOPE | NEEDS_EVALUATION
        """
        # 1. Check denied_paths first (hard block)
        if self._matches_any_pattern(path, self.denied_paths):
            return ManifestCheckResult.OUT_OF_SCOPE

        # 2. Check allowed_paths
        if self._matches_any_pattern(path, self.allowed_paths):
            if operation in self.allowed_ops:
                return ManifestCheckResult.IN_SCOPE
            elif operation in self.denied_ops:
                return ManifestCheckResult.OUT_OF_SCOPE
            else:
                return ManifestCheckResult.NEEDS_EVALUATION

        # 3. Path not in any granted scope
        return ManifestCheckResult.OUT_OF_SCOPE

    def _matches_any_pattern(self, path: str, patterns: list[str]) -> bool:
        """Glob matching for paths."""
        expanded_path = Path(path).expanduser()
        for pattern in patterns:
            expanded_pattern = Path(pattern).expanduser()
            if expanded_path.match(str(expanded_pattern)):
                return True
        return False
```

**Tests:**
- [ ] Path in allowed_paths + operation in allowed_ops → IN_SCOPE
- [ ] Path in denied_paths → OUT_OF_SCOPE
- [ ] Path outside all granted_paths → OUT_OF_SCOPE
- [ ] Glob patterns work (~/project/** matches ~/project/src/main.py)

#### Module 2: File Risk Scorer (Deterministic)

**`sentinel/core/risk_scorer.py`**

```python
class RiskScorer:
    # Critical paths that should be scored highest
    CRITICAL_PATHS = [
        "~/.ssh/**",
        "~/.env*",
        "~/.gnupg/**",
        "~/.aws/**",
        "~/.kube/**",
        "~/.docker/**",
    ]

    def score(self, path: str, operation: str, session: Session) -> RiskScore:
        """
        Returns: RiskScore(score=0-100, category=LOW|MEDIUM|HIGH|CRITICAL)
        100% deterministic — no randomness, no ML.
        """
        score = 0
        reasons = []

        # Check if path is in critical paths
        if self._is_critical_path(path):
            score += 50
            reasons.append("Path contains sensitive data (.ssh, .env, etc)")

        # Check if path is outside granted scope
        if not self._is_in_scope(path, session):
            score += 40
            reasons.append("File is outside granted session scope")

        # Check if file is git-tracked
        elif self._is_git_tracked(path):
            score -= 10  # Git-tracked files are safer (version history)
            reasons.append("File is in git (version control available)")
        else:
            score += 20
            reasons.append("File is not in git version control")

        # Check if file was recently edited by user
        if self._was_recently_edited(path, minutes=10):
            score += 15
            reasons.append("File was edited recently (10 min)")

        # Operation multiplier
        if operation == "DELETE":
            score = min(100, int(score * 1.5))
            reasons.append("Operation is DELETE (most risky)")
        elif operation == "EXECUTE":
            score = min(100, score + 20)
            reasons.append("Operation is EXECUTE (medium risk)")

        category = self._categorize(score)
        return RiskScore(
            score=score,
            category=category,
            reasons=reasons,
            file_size=self._get_file_size(path),
            is_git_tracked=self._is_git_tracked(path),
            is_in_scope=self._is_in_scope(path, session)
        )

    def _categorize(self, score: int) -> str:
        if score <= 30:
            return "LOW"
        elif score <= 60:
            return "MEDIUM"
        elif score <= 85:
            return "HIGH"
        else:
            return "CRITICAL"

    def _is_critical_path(self, path: str) -> bool:
        """Check if path matches any CRITICAL_PATHS pattern."""
        expanded = Path(path).expanduser()
        for critical in self.CRITICAL_PATHS:
            if expanded.match(critical):
                return True
        return False

    # Helper methods...
```

**Tests:**
- [ ] ~/.ssh/id_rsa DELETE → CRITICAL (score ~90+)
- [ ] ~/.env WRITE → CRITICAL (score ~85+)
- [ ] ~/project/src/main.py DELETE (git-tracked) → MEDIUM (score ~40-60)
- [ ] ~/project/untracked.txt DELETE → HIGH (score ~70+)

#### Module 3: Policy Engine

**`sentinel/core/policy_engine.py`**

```python
class PolicyEngine:
    def __init__(self, policies_dir: Path):
        self.policies = self._load_policies(policies_dir)

    def evaluate(self, agent_type: str, action_type: str, path: str, operation: str) -> PolicyDecision:
        """
        Evaluates all active policies in priority order.
        Returns: ALLOW | DENY | REQUIRE_CONFIRMATION
        """
        for policy in sorted(self.policies, key=lambda p: p.priority, reverse=True):
            if not policy.is_active:
                continue

            # Check if policy applies to this agent
            if policy.agent_type and policy.agent_type != agent_type:
                continue

            # Check if policy applies to this action type
            if policy.action_type and policy.action_type != action_type:
                continue

            # Check if path matches rule
            for rule in policy.rules:
                if self._path_matches(path, rule.path_pattern):
                    if self._operation_matches(operation, rule.operation):
                        # Rule matched!
                        return PolicyDecision(
                            effect=rule.effect,  # DENY, REQUIRE_CONFIRMATION, WARN
                            policy_id=policy.id,
                            rule_id=rule.id,
                            reason=rule.reason
                        )

        # No rule matched → allow
        return PolicyDecision(effect="ALLOW", reason="No policy rules apply")

    def _load_policies(self, policies_dir: Path) -> list[Policy]:
        """Load all active policies from TOML files."""
        policies = []
        for toml_file in policies_dir.glob("*.toml"):
            data = tomllib.loads(toml_file.read_text())
            policy = Policy.from_toml(data, toml_file)
            policies.append(policy)
        return policies

    # Helper methods...
```

**Default Policies (included in repo):**
- [ ] `no-delete-outside-project.toml` — DENY DELETE outside session.granted_paths
- [ ] `protect-secrets.toml` — DENY all ops on ~/.ssh, ~/.env*, ~/.gnupg
- [ ] `no-system-modification.toml` — DENY on /etc, /usr, /System
- [ ] `git-clean-warning.toml` — REQUIRE_CONFIRMATION on `git clean -fd`, `git reset --hard`

#### Module 4: Decision Engine (The Brain)

**`sentinel/core/decision_engine.py`**

```python
class DecisionEngine:
    def __init__(self, manifest_checker, risk_scorer, policy_engine, circuit_breaker):
        self.manifest_checker = manifest_checker
        self.risk_scorer = risk_scorer
        self.policy_engine = policy_engine
        self.circuit_breaker = circuit_breaker

    async def decide(self, action: Action, session: Session) -> Decision:
        """
        The main logic. Returns: ALLOW | PROMPT_USER | BLOCK
        """
        # Step 1: Check manifest
        manifest_result = self.manifest_checker.check(action.target_path, action.operation)
        if manifest_result == ManifestCheckResult.OUT_OF_SCOPE:
            return Decision(
                outcome="BLOCK",
                reason_code="MANIFEST_DENY",
                explanation="Path is outside the scope granted to this agent"
            )

        # Step 2: Check policy
        policy_decision = self.policy_engine.evaluate(
            action.agent_type, action.action_type, action.target_path, action.operation
        )
        if policy_decision.effect == "DENY":
            return Decision(
                outcome="BLOCK",
                reason_code="POLICY_DENY",
                policy_id=policy_decision.policy_id,
                explanation=policy_decision.reason
            )

        # Step 3: Check circuit breaker
        circuit_state = self.circuit_breaker.check(action.operation, session.id)
        if circuit_state == CircuitState.TRIPPED:
            return Decision(
                outcome="BLOCK",
                reason_code="CIRCUIT_BREAKER",
                explanation="Agent exceeded rate limit for destructive operations"
            )

        # Step 4: Score risk
        risk_score = self.risk_scorer.score(action.target_path, action.operation, session)

        # Step 5: Decide based on risk
        if risk_score.category == "CRITICAL":
            return Decision(
                outcome="PROMPT_USER",
                reason_code="HIGH_RISK",
                risk_score=risk_score.score
            )
        elif risk_score.category == "HIGH":
            return Decision(
                outcome="PROMPT_USER",
                reason_code="HIGH_RISK",
                risk_score=risk_score.score
            )
        elif risk_score.category == "MEDIUM":
            # MEDIUM risk on untracked files → prompt
            if not risk_score.is_git_tracked:
                return Decision(
                    outcome="PROMPT_USER",
                    reason_code="MEDIUM_RISK_UNTRACKED",
                    risk_score=risk_score.score
                )
            else:
                # Git-tracked and MEDIUM → allow silently
                return Decision(outcome="ALLOW", reason_code="AUTO_ALLOW_TRACKED")
        else:  # LOW risk
            # Auto-allow reads, silent-log writes inside scope
            if action.operation == "READ":
                return Decision(outcome="ALLOW", reason_code="AUTO_ALLOW_READ")
            else:
                return Decision(outcome="ALLOW", reason_code="SILENT_LOG_WRITE")

    async def explain(self, decision: Decision, risk_score: RiskScore) -> str:
        """Generate human-readable explanation for the decision."""
        # Start with template
        template_text = self._get_template(decision.reason_code)

        # If LLM available, enhance it
        if OLLAMA_AVAILABLE:
            llm_text = await self._call_ollama(decision, risk_score, template_text)
            return llm_text
        else:
            return template_text

    def _get_template(self, reason_code: str) -> str:
        """Template-based explanations (always works, no LLM)."""
        templates = {
            "MANIFEST_DENY": "This file is outside the scope of paths you granted to this agent.",
            "POLICY_DENY": "A security policy blocks this operation.",
            "CIRCUIT_BREAKER": "The agent exceeded the rate limit for destructive operations.",
            "HIGH_RISK": "This file contains sensitive data or is outside the project scope.",
            "AUTO_ALLOW_READ": "Read operations inside the project scope are automatically allowed.",
        }
        return templates.get(reason_code, "No explanation available")
```

**Tests:**
- [ ] OUT_OF_SCOPE manifest → BLOCK
- [ ] POLICY_DENY rule → BLOCK
- [ ] Circuit breaker TRIPPED → BLOCK
- [ ] CRITICAL risk → PROMPT_USER
- [ ] LOW risk READ → ALLOW
- [ ] MEDIUM risk git-tracked → ALLOW (silent)

---

### Phase 3: Core Modules — Priority 2 (Weeks 8–11)

#### Module 5: Shell Shims

**`shims/rm.py`** (example)

```python
#!/usr/bin/env python3
"""
Wrapper for rm command that intercepts deletions.
When user types 'rm file.txt', this script:
  1. Sends deletion request to daemon
  2. Waits for decision
  3. Proceeds or blocks based on decision
"""
import sys
import subprocess
import requests
import json
from pathlib import Path

DAEMON_URL = "http://127.0.0.1:8765/daemon/intercept"

def intercept_rm(args):
    """Intercept rm command."""
    for arg in args:
        if arg.startswith('-'):
            continue
        # This is a file/dir to delete
        path = Path(arg).expanduser().resolve()
        
        # Call daemon
        try:
            response = requests.post(
                DAEMON_URL,
                json={
                    "agent_id": "shell-user",
                    "session_id": os.getenv("SENTINEL_SESSION_ID"),
                    "action_type": "FILE_DELETE",
                    "target_path": str(path),
                    "command": " ".join(sys.argv)
                },
                timeout=2
            )
            decision = response.json()
        except Exception as e:
            # Daemon offline? → allow (fail open)
            print(f"Warning: daemon offline ({e})", file=sys.stderr)
            decision = {"decision": "ALLOW"}

        if decision["decision"] == "BLOCK":
            print(f"SentinelAI blocked: {path}", file=sys.stderr)
            sys.exit(1)
        elif decision["decision"] == "PROMPT_USER":
            # Tauri app shows prompt → user responds
            # Daemon signals us to proceed via response
            print(f"SentinelAI prompt sent. Waiting for user response...", file=sys.stderr)
            # Poll daemon until decision is made
            while not decision_made:
                time.sleep(0.1)

    # If all files passed checks → execute real rm
    subprocess.run(["/bin/rm"] + args)

if __name__ == "__main__":
    intercept_rm(sys.argv[1:])
```

**Installation script `shims/install_shims.sh`:**
```bash
#!/bin/bash
# Add shim directory to beginning of PATH so shims are found first

SHIM_DIR="$HOME/.sentinelai/shims"
mkdir -p "$SHIM_DIR"

# Copy shims
cp rm.py "$SHIM_DIR/rm"
cp mv.py "$SHIM_DIR/mv"
cp cp.py "$SHIM_DIR/cp"

# Make executable
chmod +x "$SHIM_DIR"/*

# Add to PATH (user's ~/.bashrc or ~/.zshrc)
if ! grep -q "SENTINELAI_SHIMS" ~/.bashrc; then
    echo 'export PATH="$HOME/.sentinelai/shims:$PATH"  # SENTINELAI_SHIMS' >> ~/.bashrc
fi
```

#### Module 6: Blast-Radius Circuit Breaker

**`sentinel/core/circuit_breaker.py`**

```python
class CircuitBreaker:
    THRESHOLDS = {
        "deletes_per_60s": 10,
        "writes_per_60s": 50,
        "files_affected_pct": 0.20,
    }

    def __init__(self):
        self.session_counters = {}  # session_id -> counter dict
        self.state = CircuitState.CLOSED

    def check(self, action_type: str, session_id: str) -> CircuitState:
        """Check if circuit should trip."""
        counter = self.session_counters.get(session_id, self._new_counter())

        if action_type == "FILE_DELETE":
            counter["deletes_60s"].append(time.time())
            counter["deletes_60s"] = [t for t in counter["deletes_60s"] if time.time() - t < 60]
            
            if len(counter["deletes_60s"]) > self.THRESHOLDS["deletes_per_60s"]:
                self.state = CircuitState.TRIPPED
                os.kill(get_agent_pid(session_id), signal.SIGSTOP)  # Pause agent
                return CircuitState.TRIPPED

        return CircuitState.CLOSED

    def _new_counter(self):
        return {"deletes_60s": [], "writes_60s": []}
```

#### Module 7: Vault Manager (Coordinated with M4)

**`sentinel/vault/vault_manager.py`**

```python
class VaultManager:
    VAULT_PATH = Path.home() / ".sentinelai" / "vault"

    def __init__(self, db_session):
        self.db = db_session
        self.VAULT_PATH.mkdir(parents=True, exist_ok=True)

    async def pre_snapshot(self, path: str, action_id: str) -> VaultEntry:
        """
        Before agent deletes file, copy it to vault.
        """
        file_path = Path(path)
        if not file_path.exists():
            return None

        content = file_path.read_bytes()
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Dedup: don't store same file twice
        vault_entry_path = self.VAULT_PATH / file_hash[:2] / file_hash
        if not vault_entry_path.parent.exists():
            vault_entry_path.parent.mkdir(parents=True)

        # Encrypt if critical path
        if self._is_critical(path):
            from cryptography.fernet import Fernet
            cipher = Fernet(self._get_key())
            encrypted = cipher.encrypt(content)
            vault_entry_path.write_bytes(encrypted)
        else:
            vault_entry_path.write_bytes(content)

        # Log to DB
        vault_entry = VaultEntry(
            id=str(uuid4()),
            action_id=action_id,
            original_path=str(path),
            vault_path=str(vault_entry_path),
            file_hash=file_hash,
            file_size_bytes=len(content),
            encrypted=self._is_critical(path),
            deleted_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30)
        )
        self.db.add(vault_entry)
        self.db.commit()
        return vault_entry

    async def restore(self, vault_entry_id: str) -> Path:
        """Restore file from vault."""
        vault_entry = self.db.query(VaultEntry).filter_by(id=vault_entry_id).first()
        vault_path = Path(vault_entry.vault_path)
        
        content = vault_path.read_bytes()
        if vault_entry.encrypted:
            from cryptography.fernet import Fernet
            cipher = Fernet(self._get_key())
            content = cipher.decrypt(content)

        original_path = Path(vault_entry.original_path)
        original_path.parent.mkdir(parents=True, exist_ok=True)
        original_path.write_bytes(content)

        vault_entry.restored_at = datetime.now()
        self.db.commit()
        return original_path
```

---

### Phase 4: Integration (Weeks 12–14)

- [ ] IPC endpoints fully functional
- [ ] Tauri app can call `/daemon/intercept` and get decision in <500ms
- [ ] Shell shim → daemon → decision → Tauri prompt → response → action proceeds/blocks
- [ ] End-to-end test with M1: user deletes file via shell → prompt appears → response → log recorded

**Deliverable:** Full Semester 5 demo: shell deletion intercepted, prompt appears, user responds, action logged.

---

## Semester 6 — Security Engine (Your Deliverables)

### Phase 5–6: Canary System (Weeks 1–3)

- [ ] `sentinel/core/canary_manager.py`
  - [ ] Plant canary files in key locations
  - [ ] Monitor canary files with watchdog
  - [ ] Immediate HARD BLOCK if canary touched
  - [ ] CRITICAL alert to UI

### Phase 6–7: Session Snapshots + Undo (Weeks 3–8)

- [ ] `sentinel/vault/snapshot_manager.py`
  - [ ] Initialize shadow git repo at session start
  - [ ] Copy granted files to shadow repo
  - [ ] `git commit` on session end
  - [ ] `git checkout` on undo request
  - [ ] Clean up shadow repo

### Phase 8: MCP Proxy (Weeks 8–11)

**`sentinel/interceptors/mcp_proxy.py`**

```python
@fastapi_app.post("/mcp/invoke")
async def mcp_invoke(request: MCPInvoke):
    """
    Intercept MCP tool calls.
    """
    # 1. Extract action details
    tool_name = request.tool_name
    parameters = request.parameters
    
    # 2. Determine action_type from tool
    action_type = infer_action_type(tool_name, parameters)
    target_path = extract_target_path(tool_name, parameters)

    # 3. Create Action object
    action = Action(
        agent_id=request.agent_id,
        session_id=request.session_id,
        action_type=action_type,
        target_path=target_path,
        command=f"{tool_name}({parameters})"
    )

    # 4. Get decision
    decision = await decision_engine.decide(action, session)

    if decision.outcome == "BLOCK":
        return {"error": "SENTINEL_BLOCK", "reason": decision.explanation}

    # 5. Pre-snapshot if needed
    if decision.outcome == "PROMPT_USER" and should_snapshot(action_type):
        vault_entry = await vault_manager.pre_snapshot(target_path, action.id)

    # 6. Forward to real MCP tool
    mcp_response = await call_real_mcp_tool(tool_name, parameters)

    # 7. Log
    decision.outcome = "ALLOW"
    log_action(action, decision)

    return mcp_response

def infer_action_type(tool_name: str, params: dict) -> str:
    """Map MCP tool to action type."""
    # Example: "list_files" tool → FILE_READ
    # "write_file" → FILE_WRITE
    # "delete_file" → FILE_DELETE
    pass
```

### Phase 9: Optional LLM Integration (Weeks 8–11)

- [ ] Integrate Ollama (Python: `ollama.generate()`)
- [ ] Use Phi-3 mini or Qwen2-1.5B for explanation generation
- [ ] Fallback to template explanations if Ollama unavailable
- [ ] Test explanation quality + latency

---

## Semester 7 — Hardening (Your Deliverables)

### Phase 11: Testing (Weeks 3–6)

**pytest Unit Tests**

```bash
tests/
├── test_risk_scorer.py
│   - Test score for ~/.ssh path (should be HIGH/CRITICAL)
│   - Test score for git-tracked file (should be LOW)
│   - Test score for DELETE operation (higher than READ)
│   - Test score for recently-edited file (higher)
│
├── test_policy_engine.py
│   - Test DENY rule blocks operation
│   - Test no matching rule allows operation
│   - Test priority ordering
│
├── test_decision_engine.py
│   - Test out-of-scope manifest → BLOCK
│   - Test policy violation → BLOCK
│   - Test circuit breaker tripped → BLOCK
│   - Test high risk untracked file → PROMPT_USER
│   - Test low risk read → ALLOW
│
├── test_circuit_breaker.py
│   - Test 11 deletes in 60s → TRIPPED
│   - Test 9 deletes → OK
│
├── test_vault_manager.py
│   - Test file stored in vault
│   - Test file encrypted (for critical paths)
│   - Test dedup works (same hash not stored twice)
│   - Test restore recovers original content
│
└── test_snapshot_manager.py
    - Test checkpoint created at session start
    - Test undo restores all files
    - Test clean up shadow repo after session
```

**Run:**
```bash
pytest tests/ -v --cov=sentinel --cov-report=html
# Target: >85% coverage
```

### Phase 12: Latency Optimization (Weeks 8–10)

- [ ] Profile daemon decision latency with `cProfile`
- [ ] Optimize hot paths (manifest checker, risk scorer)
- [ ] Cache risk scores for repeated files
- [ ] Async I/O for vault + DB operations
- [ ] Target: p95 latency <100ms for ALLOW decisions

### Phase 13: Full Integration (Weeks 8–11)

- [ ] End-to-end: Shell shim + MCP proxy + browser extension all working
- [ ] Collect metrics: block rate, latency, vault usage
- [ ] Support M4 research experiments

---

## API Endpoints (You Implement These)

### Main Decision Endpoint
```python
@app.post("/daemon/intercept")
async def intercept(request: InterceptRequest) -> InterceptResponse:
    """
    Called by shell shims, MCP proxy, file watcher, browser extension.
    Returns decision + action_id for logging.
    """
    action = Action(
        agent_id=request.agent_id,
        session_id=request.session_id,
        action_type=request.action_type,
        target_path=request.target_path,
        command=request.command
    )
    
    decision = await decision_engine.decide(action, session)
    
    if decision.outcome == "PROMPT_USER":
        vault_entry = await vault_manager.pre_snapshot(request.target_path, action.id)
    
    await log_action(action, decision)
    
    return InterceptResponse(
        decision=decision.outcome,
        action_id=action.id,
        reason_code=decision.reason_code,
        explanation=decision.explanation,
        snapshot_taken=decision.outcome == "PROMPT_USER"
    )
```

### Session Management
```python
@app.get("/daemon/session/start")
async def start_session(agent_id: str, task: str, paths: list[str]) -> dict:
    session = Session(agent_id=agent_id, task_description=task, granted_paths=paths)
    checkpoint = await snapshot_manager.checkpoint(session, paths)
    session.checkpoint_commit = checkpoint
    db.add(session)
    db.commit()
    return {"session_id": session.id, "checkpoint_commit": checkpoint}

@app.post("/daemon/session/end")
async def end_session(session_id: str) -> dict:
    session = db.query(Session).filter_by(id=session_id).first()
    session.ended_at = datetime.now()
    db.commit()
    return {"ok": True}

@app.post("/daemon/session/undo")
async def undo_session(session_id: str) -> dict:
    session = db.query(Session).filter_by(id=session_id).first()
    result = await snapshot_manager.undo_session(session)
    return {"ok": True, "restored_files": result.restored_files}
```

### Vault & Alerts
```python
@app.get("/daemon/vault")
async def get_vault(session_id: str = None) -> dict:
    query = db.query(VaultEntry)
    if session_id:
        query = query.filter_by(session_id=session_id)
    return {"entries": query.all()}

@app.post("/daemon/vault/restore")
async def restore_vault(vault_entry_id: str) -> dict:
    restored_path = await vault_manager.restore(vault_entry_id)
    return {"ok": True, "restored_path": str(restored_path)}

@app.get("/daemon/alerts")
async def get_alerts(unread_only: bool = False) -> dict:
    query = db.query(Alert)
    if unread_only:
        query = query.filter_by(is_read=False)
    return {"alerts": query.all()}

@app.post("/daemon/browser-event")
async def browser_event(event: BrowserEvent) -> dict:
    # Log browser event, generate alert if suspicious
    pass
```

### Utility
```python
@app.get("/daemon/status")
async def status() -> dict:
    return {
        "running": True,
        "active_session": current_session,
        "circuit_breaker_state": circuit_breaker.state,
        "vault_size_mb": get_vault_size()
    }
```

---

## Git Workflow

**Branch Prefix:** `feature/daemon-*`

```bash
git checkout develop
git pull
git checkout -b feature/daemon-decision-engine

# Work locally
python -m pytest tests/
python -m uvicorn sentinel.main:app --reload

# Commit
git commit -m "feat(daemon): implement decision engine core logic

- Permission manifest checker
- File risk scorer (deterministic)
- Policy engine (rule evaluation)
- Combine all signals → ALLOW/PROMPT/BLOCK decision
- Add comprehensive tests (>85% coverage)

Closes: PLAN.md #Phase 3 Priority 1"

git push origin feature/daemon-decision-engine
# PR → review → merge
```

---

## Definition of Done

- [ ] Code written + passes linter (black, isort, pylint)
- [ ] All type hints present (mypy --strict should pass)
- [ ] Error handling (timeout, daemon offline, bad manifest)
- [ ] Unit tests >85% coverage
- [ ] Docstrings for all public functions
- [ ] Manual testing on your machine
- [ ] Code review by another member
- [ ] PR merged to develop
- [ ] PLAN.md checkbox updated

---

## Success Criteria

### Semester 5
- [ ] Daemon starts successfully on port 8765
- [ ] `/daemon/intercept` endpoint responds in <500ms
- [ ] Shell shim integration works: rm deletion triggers decision
- [ ] Permission prompt appears in Tauri app
- [ ] Action logged to audit_logs table
- [ ] Demo: delete file → prompt → response → action

### Semester 6
- [ ] Circuit breaker trips on 11 deletes/minute (and pauses agent)
- [ ] Canary file touch triggers immediate BLOCK
- [ ] Vault stores and encrypts files
- [ ] Session undo restores all changed files
- [ ] MCP proxy intercepts tool calls

### Semester 7
- [ ] All pytest tests pass (>85% coverage)
- [ ] Latency p95 <100ms for ALLOW decisions
- [ ] Optional LLM explanations work (or gracefully fall back)
- [ ] Research metrics collected (block rate, FPR, latency, recovery)

---

## Questions to Ask Others

### For M1 (Tauri UI)
- When you call `/daemon/intercept`, what's your timeout? (recommend 2 seconds)
- Should auto-decision happen after 30 seconds with no user response?

### For M4 (Database)
- Confirm SQLAlchemy model schemas (Action, Decision, VaultEntry, etc.)
- What's the best way to query "actions per hour" efficiently?
- Should audit_logs have indexes on (action_id, session_id, created_at)?

---

*This is YOUR role plan. Update it as you progress.*
*Last updated: [DATE] · Version: 1.0*
