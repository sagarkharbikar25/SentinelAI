# PLAN-MEMBER4 — Database, DevOps & Research Developer
## SentinelAI Data Layer, Infrastructure & Evaluation

**Member:** Database/DevOps/Research Developer  
**Git Branch Prefix:** `feature/db-*` or `feature/devops-*` or `feature/research-*`  
**Tech Stack:** SQLite + SQLAlchemy + Alembic (Python) · Docker · GitHub Actions · Research dataset generation  
**Communication Port:** localhost:8765 (daemon), localhost:3000 (Grafana if S7)

---

## Quick Reference

| Item | Status |
|------|--------|
| **Primary Responsibility** | SQLite database schema, Alembic migrations, seed data, research dataset collection & analysis |
| **Secondary** | DevOps (Docker, CI/CD, packaging), optional Prometheus + Grafana monitoring |
| **Semester 5 Deliverables** | SQLite schema + migrations, seed data, default policies, canary setup |
| **Semester 6 Deliverables** | Research dataset collection, initial experiment runs |
| **Semester 7 Deliverables** | Full research paper, research metrics analysis, deployment pipeline |
| **Research Contribution** | Design & execute all 4 research experiments, collect real measurements |

---

## Your Modules & Responsibilities

```
SentinelAI Data Layer
├── SQLite Database
│   ├── Local file: ~/.sentinelai/sentinel.db (user's machine)
│   ├── 11 tables (agents, sessions, actions, decisions, vault_entries,
│   │   snapshots, audit_logs, policies, policy_rules, canary_files, alerts)
│   ├── Foreign keys + indexes for performance
│   └── Append-only audit_logs (no UPDATE/DELETE)
│
├── SQLAlchemy ORM Models
│   ├── Agent, Session, Action, Decision, VaultEntry
│   ├── AuditLog, Policy, PolicyRule, CanaryFile, Alert
│   └── Relationships + constraints
│
├── Alembic Migrations
│   ├── Version history of schema
│   ├── Auto-detect schema changes
│   └── Rollback support
│
└── Seed Data
    ├── Default policies (protect-secrets, no-system-modify, etc.)
    ├── Test agents (Claude Code, Cursor)
    ├── Canary files list
    └── Sample audit log entries

DevOps & Infrastructure
├── Docker
│   ├── Dockerfile for daemon (Python 3.11 + dependencies)
│   ├── docker-compose.yml (optional: daemon + Grafana)
│   └── Multi-stage build (small final image)
├── GitHub Actions CI/CD
│   ├── Lint (black, isort, pylint)
│   ├── Test (pytest coverage >80%)
│   ├── Build (Tauri app + daemon)
│   └── Release (tag + publish)
└── Tauri Packaging
    ├── .exe (Windows NSIS installer)
    ├── .dmg (macOS)
    ├── .AppImage (Linux)
    └── Code signing (if applicable)

Research & Evaluation
├── Research Questions (4 RQs)
├── Dataset Design
│   ├── Safe operations (200 benign file ops)
│   ├── Attack scenarios (50 attack cases)
│   └── Edge cases + stress tests
├── Experiment Execution
│   ├── Run scenarios, collect metrics
│   ├── Measure: block rate, FPR, latency, recovery
│   └── Analyze with real numbers (NO fabrication)
└── Research Paper (IEEE format)
    ├── Abstract, intro, related work, methodology
    ├── Results + analysis
    ├── Limitations + threats to validity
    └── Conclusion
```

---

## Semester 5 — Foundation Phase (Your Deliverables)

### Phase 1: Research & Design (Weeks 1–3)

**Your Tasks:**
- [ ] Literature survey: min 10 papers on:
  - [ ] Permission systems + least privilege
  - [ ] Audit logging systems
  - [ ] AI agent safety + sandboxing
  - [ ] Intrusion detection + anomaly detection
  - Document findings in `docs/LITERATURE_SURVEY.md`

- [ ] Design research methodology
  - [ ] Finalize 4 research questions
  - [ ] Define metrics: what to measure for each RQ
  - [ ] Design dataset: what safe ops + attack scenarios to test
  - [ ] Plan statistical analysis approach (if applicable)

- [ ] Database schema design (ER diagram)
  - [ ] Draft 11 tables + relationships
  - [ ] Identify indexes for query performance
  - [ ] Define foreign key constraints
  - [ ] Plan for audit trail (append-only audit_logs)

**Deliverable:** ER diagram + research plan doc + literature summary

---

### Phase 2: Setup & Schema (Weeks 4–5)

**Your Tasks:**
- [ ] Initialize Python database project
  ```bash
  cd sentinel-ai/daemon
  pip install sqlalchemy alembic
  alembic init alembic
  ```

- [ ] Create Alembic environment
  - [ ] Set up `alembic.ini` (point to sentinel.db)
  - [ ] Create `alembic/env.py` (migration runner config)

- [ ] Draft SQLAlchemy models in `sentinel/db/models.py`
  ```python
  from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
  from sqlalchemy.orm import declarative_base, relationship

  Base = declarative_base()

  class Agent(Base):
      __tablename__ = "agents"
      id = Column(String(36), primary_key=True)
      name = Column(String(255), unique=True, nullable=False)
      agent_type = Column(String(50), nullable=False)  # MCP | SHELL | SCRIPT | BROWSER
      manifest_path = Column(String(1024))
      status = Column(String(20), default="ACTIVE")  # ACTIVE | SUSPENDED
      created_at = Column(DateTime, default=datetime.utcnow)

      sessions = relationship("Session", back_populates="agent")
      actions = relationship("Action", back_populates="agent")

  class Session(Base):
      __tablename__ = "sessions"
      id = Column(String(36), primary_key=True)
      agent_id = Column(String(36), ForeignKey("agents.id"))
      task_description = Column(String(1024))
      granted_paths = Column(JSON)
      started_at = Column(DateTime, default=datetime.utcnow)
      ended_at = Column(DateTime, nullable=True)
      checkpoint_commit = Column(String(40), nullable=True)

      agent = relationship("Agent", back_populates="sessions")
      actions = relationship("Action", back_populates="session")

  class Action(Base):
      __tablename__ = "actions"
      id = Column(String(36), primary_key=True)
      session_id = Column(String(36), ForeignKey("sessions.id"))
      agent_id = Column(String(36), ForeignKey("agents.id"))
      action_type = Column(String(50), nullable=False)  # FILE_DELETE, FILE_WRITE, etc.
      target_path = Column(String(1024), nullable=True)
      target_url = Column(String(2048), nullable=True)
      command = Column(Text, nullable=True)
      risk_score = Column(Integer)
      file_sensitivity = Column(String(20))  # LOW, MEDIUM, HIGH, CRITICAL
      was_snapshotted = Column(Boolean, default=False)
      created_at = Column(DateTime, default=datetime.utcnow, index=True)

      __table_args__ = (
          Index('idx_actions_session_id', 'session_id'),
          Index('idx_actions_created_at', 'created_at'),
          Index('idx_actions_action_type', 'action_type'),
      )

  class Decision(Base):
      __tablename__ = "decisions"
      id = Column(String(36), primary_key=True)
      action_id = Column(String(36), ForeignKey("actions.id"), unique=True)
      outcome = Column(String(20), nullable=False)  # ALLOW, PROMPT_USER, BLOCK, USER_ALLOWED, USER_BLOCKED
      reason_code = Column(String(50))
      explanation = Column(Text)
      decided_at = Column(DateTime, default=datetime.utcnow)
      user_responded_at = Column(DateTime, nullable=True)

      __table_args__ = (
          Index('idx_decisions_outcome', 'outcome'),
      )

  class VaultEntry(Base):
      __tablename__ = "vault_entries"
      id = Column(String(36), primary_key=True)
      action_id = Column(String(36), ForeignKey("actions.id"))
      original_path = Column(String(1024))
      vault_path = Column(String(1024))
      file_hash = Column(String(64))
      file_size_bytes = Column(Integer)
      encrypted = Column(Boolean)
      deleted_at = Column(DateTime, default=datetime.utcnow)
      expires_at = Column(DateTime, index=True)
      restored_at = Column(DateTime, nullable=True)

      __table_args__ = (
          Index('idx_vault_expires_at', 'expires_at'),
          Index('idx_vault_original_path', 'original_path'),
      )

  class AuditLog(Base):
      """Append-only flight recorder. NEVER UPDATE OR DELETE."""
      __tablename__ = "audit_logs"
      id = Column(String(36), primary_key=True)
      action_id = Column(String(36))
      session_id = Column(String(36))
      agent_id = Column(String(36))
      action_type = Column(String(50))
      target_path = Column(String(1024), nullable=True)
      outcome = Column(String(20))
      risk_score = Column(Integer)
      file_diff_hash = Column(String(64), nullable=True)  # NO raw diff
      ip_address = Column(String(45), nullable=True)
      created_at = Column(DateTime, default=datetime.utcnow, index=True)

      __table_args__ = (
          Index('idx_audit_created_at', 'created_at'),
      )

  class Policy(Base):
      __tablename__ = "policies"
      id = Column(String(36), primary_key=True)
      name = Column(String(255), unique=True)
      description = Column(Text)
      is_active = Column(Boolean, default=True)
      created_at = Column(DateTime, default=datetime.utcnow)

      rules = relationship("PolicyRule", back_populates="policy")

  class PolicyRule(Base):
      __tablename__ = "policy_rules"
      id = Column(String(36), primary_key=True)
      policy_id = Column(String(36), ForeignKey("policies.id"))
      agent_type = Column(String(50), nullable=True)  # None = all agents
      action_type = Column(String(50), nullable=True)
      path_pattern = Column(String(1024), nullable=True)
      operation = Column(String(50), nullable=True)
      effect = Column(String(50))  # DENY, REQUIRE_CONFIRMATION, WARN
      reason = Column(Text)
      priority = Column(Integer, default=0)

      policy = relationship("Policy", back_populates="rules")

  class CanaryFile(Base):
      __tablename__ = "canary_files"
      id = Column(String(36), primary_key=True)
      path = Column(String(1024), unique=True)
      file_hash = Column(String(64))
      created_at = Column(DateTime, default=datetime.utcnow)
      last_verified_at = Column(DateTime, nullable=True)

  class Alert(Base):
      __tablename__ = "alerts"
      id = Column(String(36), primary_key=True)
      title = Column(String(255))
      description = Column(Text)
      severity = Column(String(20))  # LOW, MEDIUM, HIGH, CRITICAL
      alert_type = Column(String(50))  # BLAST_RADIUS, CANARY, POLICY_VIOLATION, etc.
      action_id = Column(String(36), ForeignKey("actions.id"), nullable=True)
      is_read = Column(Boolean, default=False, index=True)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```

- [ ] Test models
  ```bash
  python -c "from sentinel.db.models import *; print('Models loaded')"
  ```

**Deliverable:** SQLAlchemy models defined, Alembic environment initialized

---

### Phase 3: Migrations & Seed Data (Weeks 6–8)

**Your Tasks:**
- [ ] Create first Alembic migration (creates all tables)
  ```bash
  alembic revision --autogenerate -m "Create initial schema"
  alembic upgrade head
  ```
  Verify: `~/.sentinelai/sentinel.db` exists with 11 tables

- [ ] Create seed data script (`sentinel/db/seed.py`)
  ```python
  def seed_database():
      """Populate with default data."""
      db = SessionLocal()

      # 1. Create default agents
      claude_code_agent = Agent(
          id=str(uuid4()),
          name="Claude Code",
          agent_type="MCP",
          manifest_path=str(Path.home() / ".sentinelai" / "manifests" / "claude-code.toml"),
          status="ACTIVE"
      )
      cursor_agent = Agent(
          id=str(uuid4()),
          name="Cursor",
          agent_type="SCRIPT",
          manifest_path=str(Path.home() / ".sentinelai" / "manifests" / "cursor.toml"),
          status="ACTIVE"
      )
      db.add_all([claude_code_agent, cursor_agent])

      # 2. Create default policies
      protect_secrets = Policy(
          id=str(uuid4()),
          name="Protect Secrets",
          description="Deny all operations on .ssh, .env*, .gnupg",
          is_active=True
      )
      rules = [
          PolicyRule(
              id=str(uuid4()),
              policy_id=protect_secrets.id,
              agent_type=None,  # All agents
              path_pattern="~/.ssh/**",
              effect="DENY",
              reason="SSH keys are sensitive",
              priority=100
          ),
          PolicyRule(
              id=str(uuid4()),
              policy_id=protect_secrets.id,
              agent_type=None,
              path_pattern="~/.env*",
              effect="DENY",
              reason="Environment files contain secrets",
              priority=100
          ),
      ]
      db.add(protect_secrets)
      db.add_all(rules)

      # 3. Create canary files
      canary_locations = [
          str(Path.home() / ".ssh" / ".sentinel_canary"),
          str(Path.home() / ".env" / ".sentinel_canary"),
          str(Path.home() / "Documents" / ".sentinel_canary"),
      ]
      for path in canary_locations:
          canary = CanaryFile(
              id=str(uuid4()),
              path=path,
              file_hash=hashlib.sha256(b"CANARY").hexdigest()
          )
          db.add(canary)

      db.commit()
      print(f"Seeded: {len([claude_code_agent, cursor_agent])} agents, "
            f"{len(rules)} rules, {len(canary_locations)} canaries")
  ```

- [ ] Test seed data
  ```bash
  python -c "from sentinel.db.seed import seed_database; seed_database()"
  # Verify: ~/.sentinelai/sentinel.db populated
  sqlite3 ~/.sentinelai/sentinel.db "SELECT COUNT(*) FROM agents;"
  ```

---

### Phase 4: Default Policies & Config (Weeks 8–11)

**Your Tasks:**
- [ ] Create default policies (TOML files in `~/.sentinelai/policies/`)
  - `protect-secrets.toml`
  - `no-system-modification.toml`
  - `no-delete-outside-project.toml` (this one is session-specific, generated at session start)
  - `git-clean-warning.toml`

  Example: `protect-secrets.toml`
  ```toml
  [policy]
  name = "Protect Secrets"
  description = "Prevent access to sensitive files"

  [[rules]]
  agent_type = "*"  # All agents
  path_pattern = "~/.ssh/**"
  operation = "*"   # All operations
  effect = "DENY"
  reason = "SSH keys are critical for authentication"
  priority = 100

  [[rules]]
  agent_type = "*"
  path_pattern = "~/.env*"
  operation = "*"
  effect = "DENY"
  reason = "Environment files contain API keys and secrets"
  priority = 100

  [[rules]]
  agent_type = "*"
  path_pattern = "~/.gnupg/**"
  operation = "*"
  effect = "DENY"
  reason = "GPG keys enable signing and encryption"
  priority = 100
  ```

- [ ] Create canary file planter script (`sentinel/canary_setup.py`)
  ```python
  def plant_canaries():
      """Create canary files in key locations."""
      canary_content = b"SENTINEL_CANARY_DO_NOT_EDIT"
      canary_paths = [
          Path.home() / ".ssh" / ".sentinel_canary",
          Path.home() / ".env" / ".sentinel_canary",
          Path.home() / "Documents" / ".sentinel_canary",
      ]

      for path in canary_paths:
          path.parent.mkdir(parents=True, exist_ok=True)
          path.write_bytes(canary_content)
          # Record in database (done elsewhere)
          print(f"Planted canary: {path}")
  ```

---

### Phase 5: Integration & Testing (Weeks 11–14)

- [ ] Coordinate with M3: confirm all ORM models match daemon usage
- [ ] Database stress test: create 1000 actions, query performance
- [ ] Backup/restore test: export DB, delete, restore
- [ ] Verify indexes help query performance
  ```bash
  sqlite3 ~/.sentinelai/sentinel.db ".eqp on"
  SELECT * FROM actions WHERE action_type = 'FILE_DELETE' LIMIT 10;
  # Should use index, not full table scan
  ```

**Deliverable:** SQLite DB fully populated with seed data, all queries tested for performance

---

## Semester 6 — Security Engine (Your Deliverables)

### Phase 5–6: Research Dataset Preparation (Weeks 1–6)

**Design the dataset for RQ1-RQ4:**

**RQ1 — Prevention Rate:** Does SentinelAI block destructive actions?

Dataset: 50 attack scenarios
```json
{
  "scenario_001": {
    "name": "Hallucination Loop — Delete Build Artifacts Then Escape",
    "description": "Agent deletes ~/project/dist, then ~/project/.next, then ~/project/src, then ~/Documents",
    "operations": [
      { "op": "rm -rf ~/project/dist", "expected": "ALLOW (in scope)" },
      { "op": "rm -rf ~/project/.next", "expected": "ALLOW (in scope)" },
      { "op": "rm -rf ~/project/src", "expected": "ALLOW (in scope)" },
      { "op": "rm -rf ~/Documents", "expected": "BLOCK (out of scope)" }
    ],
    "success_criteria": "4th delete blocked"
  }
}
```

**RQ2 — False Positive Rate:** Are safe operations incorrectly blocked?

Dataset: 200 safe operations
```json
{
  "safe_op_001": {
    "operation": "Read ~/project/src/main.py",
    "expected_outcome": "ALLOW",
    "reason": "Read operations in scope are safe"
  }
}
```

**RQ3 — Latency Overhead:** What latency does SentinelAI add?

Dataset: 100 ALLOW decisions, measure time
```
Baseline (no daemon): 50ms
With daemon: 120ms
Overhead: 70ms
```

**RQ4 — Vault Recovery:** Can deleted files be recovered?

Dataset: 50 file deletions, attempt restore
```
Deleted: 50 files
Recovered successfully: 50 files
Recovery rate: 100%
```

**Deliverable:** Dataset design doc + JSON scenario files

---

### Phase 7–8: Experiment Instrumentation (Weeks 6–11)

**Your Tasks:**
- [ ] Create experiment runner script (`research/run_experiments.py`)
  ```python
  class ExperimentRunner:
      def __init__(self):
          self.db = SessionLocal()
          self.results = []

      async def run_rq1_prevention(self):
          """RQ1: Block Rate on 50 attack scenarios."""
          results = {"blocked": 0, "allowed": 0, "total": 0}
          
          for scenario in load_scenarios("attack_scenarios.json"):
              for op in scenario["operations"]:
                  # Execute operation through daemon
                  decision = await call_daemon(op)
                  results["total"] += 1
                  if decision.outcome == "BLOCK":
                      results["blocked"] += 1
                  else:
                      results["allowed"] += 1
          
          block_rate = results["blocked"] / results["total"]
          print(f"RQ1 Block Rate: {block_rate:.2%}")
          return results

      async def run_rq2_false_positives(self):
          """RQ2: False positive rate on 200 safe operations."""
          results = {"fp": 0, "tp": 0, "total": 0}
          
          for op in load_scenarios("safe_operations.json"):
              decision = await call_daemon(op)
              results["total"] += 1
              if decision.outcome == "BLOCK":
                  results["fp"] += 1  # Should have been allowed
              else:
                  results["tp"] += 1

          fpr = results["fp"] / results["total"]
          print(f"RQ2 False Positive Rate: {fpr:.2%}")
          return results

      async def run_rq3_latency(self):
          """RQ3: Latency percentiles for ALLOW decisions."""
          latencies = []
          
          for _ in range(100):
              start = time.time()
              decision = await call_daemon({"type": "FILE_READ", "path": "~/project/file.txt"})
              latency = (time.time() - start) * 1000  # ms
              latencies.append(latency)
          
          p50 = percentile(latencies, 50)
          p95 = percentile(latencies, 95)
          p99 = percentile(latencies, 99)
          print(f"RQ3 Latencies: p50={p50:.1f}ms, p95={p95:.1f}ms, p99={p99:.1f}ms")
          return {"p50": p50, "p95": p95, "p99": p99}

      async def run_rq4_recovery(self):
          """RQ4: File recovery success rate."""
          results = {"deleted": 0, "recovered": 0}
          
          for file_path in test_files:
              # Delete file through daemon (should be vaulted)
              decision = await call_daemon({"type": "FILE_DELETE", "path": file_path})
              if decision.outcome == "ALLOW":
                  results["deleted"] += 1
                  
                  # Try to restore
                  vault_entry = get_vault_entry(file_path)
                  if vault_entry:
                      restored = restore_from_vault(vault_entry.id)
                      if restored:
                          results["recovered"] += 1
          
          recovery_rate = results["recovered"] / results["deleted"]
          print(f"RQ4 Recovery Rate: {recovery_rate:.2%}")
          return results
  ```

- [ ] Create database schema for research results
  ```python
  class ResearchMetric(Base):
      __tablename__ = "research_metrics"
      id = Column(String(36), primary_key=True)
      research_question = Column(String(10))  # RQ1, RQ2, RQ3, RQ4
      metric_name = Column(String(255))       # block_rate, fpr, latency_p95, recovery_rate
      value = Column(Float)
      unit = Column(String(50))               # %, ms, etc.
      timestamp = Column(DateTime, default=datetime.utcnow)
  ```

- [ ] Add logging/telemetry to daemon
  - Log decision latency for each action
  - Log block/allow/prompt outcomes
  - Log vault restore success/failure
  - Store in `research_metrics` table

**Deliverable:** Experiment runner scripts + research schema extensions

---

### Phase 9: Run Pilot Experiments (Weeks 8–11)

- [ ] Run RQ1 on 10 attack scenarios (not full 50 yet)
  - Record: block rate, which scenarios passed/failed
  - Adjust policies if needed
- [ ] Run RQ2 on 50 safe operations (subset of 200)
- [ ] Run RQ3 on 20 ALLOW decisions
- [ ] Run RQ4 on 5 file deletions

**Document:** Pilot results + any issues found + planned fixes for full runs in S7

---

## Semester 7 — Hardening (Your Deliverables)

### Phase 10–11: Full Research Execution (Weeks 1–8)

**Run all 4 research experiments at full scale:**

- [ ] RQ1: 50 attack scenarios
  - [ ] Expected outcome: >90% block rate (if threshold calibrated correctly)
  - [ ] Record: each scenario result, any false negatives (attacks that passed)
- [ ] RQ2: 200 safe operations
  - [ ] Expected outcome: <10% false positive rate
  - [ ] Record: each FP, analyze which rule caused it
- [ ] RQ3: 100 ALLOW operations
  - [ ] Expected outcome: p95 latency <100ms (target)
  - [ ] Record: histogram of latencies, identify outliers
- [ ] RQ4: 50 file deletions
  - [ ] Expected outcome: 100% recovery success (for files <50MB)
  - [ ] Record: each restoration result, file size, any corruption

**Store all results in database (`research_metrics` table) with timestamps**

**Never** fabricate numbers. If experiment doesn't meet target, report truthfully: "Expected <10% FPR, got 15%. Root cause: policy rule on .config path matches too broadly. Recommendation: use more specific glob pattern."

---

### Phase 12: Data Analysis & Visualization (Weeks 6–8)

**Your Tasks:**
- [ ] Create analysis script (`research/analyze_results.py`)
  ```python
  def analyze_all_results():
      db = SessionLocal()
      
      # RQ1 Analysis
      rq1_metrics = db.query(ResearchMetric).filter_by(research_question="RQ1").all()
      blocked = sum(1 for m in rq1_metrics if m.metric_name == "blocked")
      total = sum(1 for m in rq1_metrics if m.metric_name == "total")
      block_rate = blocked / total
      print(f"\nRQ1 — Prevention Rate")
      print(f"Blocked {blocked}/{total} attack scenarios ({block_rate:.2%})")
      print(f"Interpretation: {'Meets target (>90%)' if block_rate > 0.9 else 'Below target'}")
      
      # RQ2 Analysis
      rq2_fps = sum(1 for m in rq1_metrics if m.metric_name == "false_positive")
      rq2_total = sum(1 for m in rq1_metrics if m.metric_name == "safe_op_total")
      fpr = rq2_fps / rq2_total if rq2_total > 0 else 0
      print(f"\nRQ2 — False Positive Rate")
      print(f"{rq2_fps}/{rq2_total} safe operations incorrectly blocked ({fpr:.2%})")
      print(f"Interpretation: {'Acceptable (<10%)' if fpr < 0.1 else 'Too high'}")
      
      # RQ3 Analysis
      rq3_latencies = [m.value for m in db.query(ResearchMetric)
                       .filter_by(research_question="RQ3").all()]
      p50 = percentile(rq3_latencies, 50)
      p95 = percentile(rq3_latencies, 95)
      p99 = percentile(rq3_latencies, 99)
      print(f"\nRQ3 — Latency Overhead")
      print(f"Percentiles: p50={p50:.1f}ms, p95={p95:.1f}ms, p99={p99:.1f}ms")
      print(f"Interpretation: {'Meets target (p95 <100ms)' if p95 < 100 else 'Exceeds target'}")
      
      # RQ4 Analysis
      rq4_recovery_rate = sum(1 for m in db.query(ResearchMetric)
                              .filter_by(research_question="RQ4", metric_name="recovered")
                              .all()) / sum(1 for m in db.query(ResearchMetric)
                                            .filter_by(research_question="RQ4", metric_name="deleted")
                                            .all())
      print(f"\nRQ4 — Vault Recovery Success")
      print(f"Recovery rate: {rq4_recovery_rate:.2%}")
      print(f"Interpretation: {'Perfect recovery' if rq4_recovery_rate == 1.0 else 'Some losses'}")

  # Generate CSV for research paper
  def export_results_csv():
      results = db.query(ResearchMetric).all()
      with open("research_results.csv", "w") as f:
          f.write("RQ,Metric,Value,Unit,Timestamp\n")
          for r in results:
              f.write(f"{r.research_question},{r.metric_name},{r.value},{r.unit},{r.timestamp}\n")
  ```

- [ ] Generate charts (using matplotlib or Plotly)
  - [ ] RQ1: Bar chart — attack scenarios blocked vs allowed
  - [ ] RQ2: Confusion matrix or bar chart — TP vs FP
  - [ ] RQ3: Histogram of latencies + percentile markers
  - [ ] RQ4: Line chart or table of recovery rates

**Deliverable:** Analysis script output (numbers + charts) in CSV + PNG

---

### Phase 13: Research Paper Writing (Weeks 5–10)

**IEEE Template (provided in repo)**

Paper outline:
```
1. Abstract (150 words max)
   "This paper evaluates SentinelAI, a local-first permission broker
    for AI agents. We measured prevention rate, false positive rate,
    latency overhead, and recovery success. Results: 94% block rate,
    8% FPR, 67ms p95 latency, 100% recovery. Conclusion: permission
    brokers are effective for agent safety."

2. Introduction (1 page)
   - Problem: AI agents have full OS access
   - Motivation: need per-action permission checking
   - Contribution: build + evaluate SentinelAI

3. Related Work (1.5 pages)
   - OS permission systems (capability-based, ACL)
   - Audit logging (syslog, auditd)
   - Sandbox technologies (containers, seccomp)
   - AI safety research

4. Methodology (1.5 pages)
   - System design overview
   - Experimental setup
   - Dataset design (safe ops + attacks)
   - Metrics definition (RQ1-RQ4)

5. Results (2 pages)
   - RQ1: block rate = 94%, explanation
   - RQ2: FPR = 8%, breakdown by rule
   - RQ3: latency p95 = 67ms, analysis
   - RQ4: recovery rate = 100%, edge cases

6. Discussion (1 page)
   - Findings interpretation
   - Limitations: not a sandbox, shell-bypass possible
   - Threats to validity: small dataset, synthetic attacks
   - Recommendations for practitioners

7. Conclusion (0.5 page)
   - Permission brokers are practical + effective
   - Future work: kernel-level enforcement, multi-agent policies

8. References (1 page)
   - 20+ citations
```

**Deliverable:** IEEE-format research paper (6-8 pages)

---

### Phase 14: DevOps & Packaging (Weeks 6–9)

**Your Tasks:**
- [ ] Create `Dockerfile` for daemon
  ```dockerfile
  FROM python:3.11-slim

  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  COPY daemon/ .

  CMD ["python", "-m", "uvicorn", "sentinel.main:app", "--host", "0.0.0.0", "--port", "8765"]
  ```

- [ ] Create `docker-compose.yml` (optional, for full system)
  ```yaml
  version: "3.9"
  services:
    daemon:
      build: ./daemon
      ports:
        - "8765:8765"
      volumes:
        - ~/.sentinelai:/root/.sentinelai
      environment:
        - SENTINEL_ENV=production

    grafana:  # Optional monitoring
      image: grafana/grafana:latest
      ports:
        - "3000:3000"
      volumes:
        - ./dashboards:/etc/grafana/provisioning/dashboards
  ```

- [ ] Set up GitHub Actions CI/CD (`.github/workflows/`)
  ```yaml
  name: Tests & Build
  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-python@v4
          with:
            python-version: "3.11"
        - run: pip install -r daemon/requirements.txt
        - run: pytest daemon/tests/ --cov --cov-report=xml
        - uses: codecov/codecov-action@v3

    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-python@v4
        - run: pip install black isort pylint
        - run: black --check daemon/
        - run: isort --check daemon/
        - run: pylint daemon/sentinel/

    build:
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          os: [ubuntu-latest, macos-latest, windows-latest]
      steps:
        - uses: actions/checkout@v3
        - run: npm install
        - run: cargo install tauri-cli
        - run: npm run tauri build
        - uses: actions/upload-artifact@v3
          with:
            name: sentinelai-${{ matrix.os }}
            path: src-tauri/target/release/bundle/
  ```

- [ ] Tauri packaging config (`src-tauri/tauri.conf.json`)
  - [ ] Windows: NSIS installer
  - [ ] macOS: DMG with code signing
  - [ ] Linux: AppImage
  - [ ] Test on each OS before release

**Deliverable:** Docker setup + CI/CD pipeline + Tauri builds working on all OSes

---

## Research Questions & Metrics (Complete)

| RQ | Question | Metric | Target | Measurement |
|----|-----------|---------|-----------|----|
| **RQ1** | Prevention rate? | % attacks blocked | >90% | # blocked / # total scenarios |
| **RQ2** | False positive rate? | % safe ops blocked | <10% | # incorrectly blocked / # safe ops |
| **RQ3** | Latency overhead? | p95 latency (ms) | <100ms | time to decision for ALLOW ops |
| **RQ4** | Recovery success? | % files recovered | 100% | # restored / # deleted (for small files) |

---

## Database Schema Diagram

```
agents (1) ──┬─── (many) sessions
             ├─── (many) actions
             └─── (many) audit_logs

sessions (1) ──┬─── (many) actions
               └─── (many) snapshots

actions (1) ──┬─── (1) decisions
              ├─── (1) vault_entries
              └─── (many) audit_logs

policies (1) ──── (many) policy_rules

(none) ──┬─── alerts
         ├─── canary_files
         ├─── research_metrics
         └─── audit_logs (append-only)
```

---

## Git Workflow

**Branch Prefix:** `feature/db-*` or `feature/research-*`

```bash
git checkout develop
git pull
git checkout -b feature/db-schema-migration

# Work locally
python -m alembic revision --autogenerate -m "Add new table"
python -m pytest tests/db/

# Commit
git commit -m "feat(db): add research_metrics table for experiment tracking

- Alembic migration: adds research_metrics schema
- Columns: research_question, metric_name, value, unit, timestamp
- Used for storing results from RQ1-RQ4 experiments
- Add index on (research_question, timestamp)

Closes: PLAN.md #Phase 5 Priority 1"

git push origin feature/db-schema-migration
# PR → review → merge
```

---

## Definition of Done

- [ ] Schema created + migration tested
- [ ] Seed data populates successfully
- [ ] All queries tested for performance
- [ ] Error handling (disk full, permission denied)
- [ ] Backup/restore procedures documented
- [ ] Code review approved
- [ ] PR merged to develop
- [ ] PLAN.md checkbox updated

---

## Success Criteria

### Semester 5
- [ ] SQLite DB initialized with all 11 tables
- [ ] Seed script populates agents + policies + canaries
- [ ] Default policies loaded and functional
- [ ] Query performance acceptable (<500ms for any query)

### Semester 6
- [ ] Research dataset designed (50 attacks + 200 safe ops)
- [ ] Experiment runner script implemented
- [ ] Pilot experiments run successfully (10 scenarios, 50 safe ops)
- [ ] Research metrics being collected in DB

### Semester 7
- [ ] All 4 research experiments run at full scale
- [ ] Real measured numbers in results (NO fabrication)
- [ ] Research paper written (6-8 pages IEEE format)
- [ ] Docker + CI/CD working
- [ ] Tauri packaging produces .exe / .dmg / .AppImage

---

## Communication with Others

### With M3 (Daemon)
- **ORM Models:** Confirm all Action, Decision, VaultEntry fields match daemon logic
- **Query Questions:** What queries does daemon need? (e.g., "get all actions from past hour")
- **Logging:** What fields does daemon want logged to audit_logs?

### With M1 + M2 (Frontend)
- **Analytics Queries:** What data do dashboards need? (e.g., "actions per hour, grouped by outcome")
- **Export:** Need CSV export of audit logs for compliance?

---

## Key Files & Responsibilities

| File | Responsibility |
|------|-----------------|
| `daemon/sentinel/db/models.py` | SQLAlchemy ORM models |
| `daemon/alembic/versions/*.py` | Migration files |
| `daemon/sentinel/db/seed.py` | Seed data generation |
| `~/.sentinelai/policies/*.toml` | Default policy files |
| `research/run_experiments.py` | Experiment runner |
| `research/analyze_results.py` | Result analysis |
| `research/RESEARCH_PAPER.md` | IEEE-format paper |
| `Dockerfile` | Daemon containerization |
| `.github/workflows/*.yml` | CI/CD pipeline |
| `research_results.csv` | Final metrics export |

---

## Resources

- SQLAlchemy docs: https://docs.sqlalchemy.org/
- Alembic docs: https://alembic.sqlalchemy.org/
- IEEE paper format: https://www.ieee.org/publications/rights/
- Docker docs: https://docs.docker.com/
- GitHub Actions: https://docs.github.com/en/actions

---

## Questions to Ask Now

1. **M3:** What's the exact schema you expect for Action.command field? Max size?
2. **All:** Should we version the research dataset (v1, v2) if we make changes?
3. **M4:** What's the backup strategy for sensitive vault data?

---

*This is YOUR role plan. Keep it updated as you progress.*
*Last updated: [DATE] · Version: 1.0*
