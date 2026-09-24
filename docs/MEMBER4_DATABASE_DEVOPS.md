# MEMBER4_PLAN.md — Database, DevOps & Research Architecture
## Master Plan: Semester 5, Semester 6, and Semester 7
### Unified Data Layer: PostgreSQL / Supabase Platform + SQLite Local Security Daemon

---

```
╔══════════════════════════════════════════════════════════════════════╗
║                    MEMBER 4 — DATABASE & DEVOPS                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Status Dashboard:                                                   ║
║    Semester 5 (Foundation):           [x] IN PROGRESS / ACTIVE       ║
║    Semester 6 (Research & Datasets):  [ ] PLANNED                    ║
║    Semester 7 (Hardening & DevOps):   [ ] PLANNED                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. System Architecture Owned by Member 4

Member 4 is responsible for the complete data and infrastructure lifecycle of SentinelAI:
1. **Local Security Daemon Database (SQLite + SQLAlchemy)**: Runs locally on the user's system (`~/.sentinelai/sentinel.db`) via the Python Security Daemon (`localhost:8765`), managing real-time action interception, 11 ORM models, immutable audit logs, canaries, and vault snapshots.
2. **Cloud / Platform Database (PostgreSQL / Supabase)**: Powers the SentinelAI platform backend (NestJS `localhost:3001`), storing user credentials, RBAC roles, agents, tools, global policies, and request history.
3. **DevOps & Infrastructure**: Docker containerization (`docker-compose.yml`), backup automation (`database/backup/backup.sh`), CI/CD automation, and monitoring.
4. **Empirical Research Framework**: Curating prompt injection / policy violation datasets and executing the 4 research questions (RQ1–RQ4) with uncompromised, un-fabricated measurements.

---

## 2. Semester-by-Semester Roadmap Breakdown

### 📘 Semester 5 — Foundation Phase (Active)
**Objective:** Deliver fully operational database schemas, migrations, seed data, and containerized dev environments for both the Local Daemon and the Cloud Platform.

* **Task 5.1: Local Daemon Database (SQLite + SQLAlchemy)**
  - [x] Complete 11-table relational schema in `daemon/sentinel/db/models.py`:
    - `Agent`: Registered AI agents (Claude Code, Cursor, Shell, MCP).
    - `Session`: Active interception sessions with bounded directory scopes.
    - `Action`: Intercepted operations (FILE_DELETE, FILE_WRITE, SHELL_CMD).
    - `Decision`: Automated/human security decisions (ALLOW, WARN, BLOCK).
    - `VaultEntry`: Quarantine store for reversible file deletions.
    - `Snapshot`: Pre-action filesystem/git checkpoint tracking.
    - `Policy`: Active governance policy sets.
    - `PolicyRule`: Granular pattern-matching rules (DENY, REQUIRE_CONFIRMATION).
    - `CanaryFile`: Tripwire honeypot file records.
    - `AuditLog`: Append-only, immutable flight recorder.
    - `Alert`: Triaged security alerts.
  - [x] Create seed data generator in `daemon/sentinel/db/seed.py` for default agents, policies, canaries, and initial audit records.
  - [x] Implement Canary Tripwire installer & integrity validator (`daemon/sentinel/core/canary.py`).
  - [x] Database test suite (`daemon/tests/test_database.py`) validating model integrity, cascades, and audit immutability.

* **Task 5.2: Cloud Platform Database (PostgreSQL / Supabase)**
  - [x] SQL initial schema migration (`backend/supabase/migrations/20260823000000_initial_schema.sql`):
    - Tables: `users`, `roles`, `permissions`, `agents`, `tools`, `agent_tools`, `policies`, `policy_rules`, `requests`, `audit_logs`, `sessions`.
  - [x] Production indexes (`idx_requests_agent_id`, `idx_audit_logs_user_id`, etc.).
  - [x] Seed data with 5 system roles (`SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `ANALYST`, `VIEWER`), test accounts, sample tools, and default policies.
  - [x] Automatic database backup script (`database/backup/backup.sh`).
  - [x] Docker Compose setup (`docker-compose.yml`) for local PostgreSQL 16.
  - [x] Integration with NestJS backend `SupabaseService` with resilient offline fallback.

---

### 📗 Semester 6 — Research Datasets, Risk Calibration & Experiments
**Objective:** Build standardized, labeled benchmark datasets and execute pilot empirical experiments on agent safety.

* **Task 6.1: Research Datasets Creation**
  - [ ] **RQ1 Prevention Dataset**: 50 attack scenarios (jailbreak attempts, destructive rm loops, directory traversal outside project bounds).
  - [ ] **RQ2 Safe Operations Dataset**: 200 safe, benign file/command operations for false-positive validation.
  - [ ] **RQ3 Latency Dataset**: 100 timed ALLOW requests to benchmark interception overhead.
  - [ ] **RQ4 File Vault Recovery Dataset**: 50 file deletions tested for bit-for-bit restoration.
  - [ ] Export datasets in standard JSON format in `research/datasets/`.

* **Task 6.2: Experiment Runner & Instrumentation**
  - [ ] Build automated test runner script (`research/run_experiments.py`).
  - [ ] Create `research_metrics` persistence table in SQLite/PostgreSQL to log latency, block rate, and FPR.
  - [ ] Calibrate policy risk scoring against ground-truth datasets.
  - [ ] Maintain `RESEARCH_LOGBOOK.md` with true empirical numbers.

---

### 📙 Semester 7 — Hardening, Advanced Monitoring & Production DevOps
**Objective:** Enterprise hardening, full production CI/CD, Prometheus/Grafana observability, and final IEEE research publication.

* **Task 7.1: Production DevOps & CI/CD**
  - [ ] Multi-stage production `Dockerfile` for daemon and backend.
  - [ ] Production Compose configuration (`docker-compose.prod.yml`).
  - [ ] GitHub Actions CI pipeline: automated linting, pytest, and NestJS build on pull requests.
  - [ ] Automated database schema validation and migration checks.

* **Task 7.2: Observability & Monitoring**
  - [ ] Prometheus metrics integration (`/metrics` endpoint on daemon & NestJS).
  - [ ] Pre-configured Grafana dashboard visualizing:
    - Decisions per second (ALLOW / WARN / BLOCK).
    - Real-time p50, p95, and p99 interception latency.
    - Alert triage velocity.

* **Task 7.3: Database Security & Hardening**
  - [ ] Enforce database-level triggers preventing any UPDATE or DELETE operations on `audit_logs`.
  - [ ] Automated data retention & archiving script for requests older than 90 days.

* **Task 7.4: Research Evaluation & Paper**
  - [ ] Execute full-scale experimental runs across all 4 research questions.
  - [ ] Generate statistical charts (matplotlib / Plotly) and CSV exports.
  - [ ] Co-author IEEE-format research paper (Methodology, Experimental Setup, Results & Discussion).
