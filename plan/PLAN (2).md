# PLAN.md — SentinelAI Master Project Plan
## Single Source of Truth · All Members · All Semesters
## Version 2.0 — Desktop Daemon + Browser Extension Edition

---

```
╔══════════════════════════════════════════════════════════╗
║           PROJECT STATUS DASHBOARD                       ║
╠══════════════════════════════════════════════════════════╣
║  Overall Progress    : 0%                                ║
║  Semester 5          : 0%   [Foundation]                 ║
║  Semester 6          : 0%   [Security Engine]            ║
║  Semester 7          : 0%   [Hardening + Research]       ║
╠══════════════════════════════════════════════════════════╣
║  Member 1 (Desktop UI + Dashboard)    : 0%               ║
║  Member 2 (Security UI + Analytics)   : 0%               ║
║  Member 3 (Daemon + Interceptors)     : 0%               ║
║  Member 4 (Database + DevOps + Research): 0%             ║
╚══════════════════════════════════════════════════════════╝
```

**Status Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Completed · `[!]` Blocked

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Team Structure](#2-team-structure)
3. [Architecture](#3-architecture)
4. [Tech Stack Decision — Do We Need an LLM?](#4-tech-stack-decision--do-we-need-an-llm)
5. [Database Schema](#5-database-schema)
6. [API Reference (IPC + REST)](#6-api-reference)
7. [Core Modules](#7-core-modules)
8. [Feature Ownership Matrix](#8-feature-ownership-matrix)
9. [Semester 5 Roadmap](#9-semester-5-roadmap)
10. [Semester 6 Roadmap](#10-semester-6-roadmap)
11. [Semester 7 Roadmap](#11-semester-7-roadmap)
12. [Git Workflow](#12-git-workflow)
13. [Testing Strategy](#13-testing-strategy)
14. [Research Plan](#14-research-plan)
15. [MVP vs Advanced](#15-mvp-vs-advanced)
16. [Risk Register](#16-risk-register)
17. [Documentation Plan](#17-documentation-plan)
18. [Final Demo Script](#18-final-demo-script)
19. [Definition of Done](#19-definition-of-done)

---

## 1. Project Overview

### What is SentinelAI?

SentinelAI is a **local-first permission broker and audit layer for AI agents that automate your laptop**. It does NOT build another AI agent or chatbot. It is a security daemon that sits between the OS and any AI agent (Claude Code, Cursor, scripts, MCP tools) and controls what that agent is actually allowed to do — before it does it.

```
AI Agent (Claude Code, Cursor, automation script, MCP tool)
  ↓
SentinelAI Daemon (THIS IS WHAT WE BUILD)
  ↓ intercepts every action request
  ┌──────────────────────────────────────────────────────┐
  │  Permission Manifest Check                           │
  │    → Is this agent granted access to this path/op?  │
  │  File Risk Scorer                                    │
  │    → Is this file critical? (git-tracked, .ssh, .env)│
  │  Policy Engine                                       │
  │    → Does a rule DENY or REQUIRE_CONFIRMATION?       │
  │  Blast-Radius Circuit Breaker                        │
  │    → Too many destructive ops in short time? PAUSE.  │
  │  Decision: ALLOW / PROMPT_USER / BLOCK               │
  └──────────────────────────────────────────────────────┘
  ↓ if ALLOW
Pre-action snapshot → Execute → Log to Flight Recorder
  ↓ if destructive action that got past prevention
Vault Recovery Store (soft-delete, encrypted, 30-day TTL)
```

### The Core Problem (Updated)

Developers and students are giving AI agents full access to their laptops to automate tasks. The agent runs as the same OS user — it can delete every file, read every secret, send every email. Two failure modes are real and common:

- **Hallucination loops** — the agent misinterprets a task and runs `rm -rf` on the wrong directory
- **Prompt injection** — a malicious document/website tricks the agent into exfiltrating secrets or destroying data

The user already gave consent to "use the agent", but they never consented to "delete my thesis" or "read my SSH keys". SentinelAI separates **session consent** (I want Claude Code to help me with this project) from **per-action consent** (I did NOT authorize deleting files outside this folder).

### What SentinelAI Answers (per action)

1. Which agent is requesting this, and does it have a registered permission manifest?
2. Is this path/operation inside the scope the user granted for this session?
3. How sensitive is the target file? (git-tracked, .env, .ssh, Documents, untracked)
4. Does any policy DENY this operation (e.g. no deletes outside ~/project)?
5. Is this a blast-radius event — too many destructive ops in a burst?
6. Was this file snapshotted before the action, so we can recover?
7. What exactly changed? (flight recorder with diff)
8. Can the user undo this entire task in one click?

### Research Contribution

| Research Question | Metric |
|------------------|--------|
| RQ1: Does SentinelAI reduce destructive actions reaching the FS? | Block/Prevention rate |
| RQ2: What is the false-positive rate (safe actions incorrectly blocked)? | FPR on 200 safe operations |
| RQ3: What latency overhead does the daemon add per action? | p95 latency added (ms) |
| RQ4: How effective is vault recovery — what % of deleted files are recoverable? | Recovery success rate |

> ⚠️ SentinelAI is a **best-effort safety layer**, not a sandbox. It catches actions that go through the daemon interception layer. A fully sandboxed environment (containers, Landlock) is the only complete solution, which is outside scope for a 3-semester project. Always document this clearly.

---

## 2. Team Structure

| Member | Role | Primary Domain |
|--------|------|---------------|
| **Member 1** | Desktop UI Developer | Tauri desktop app UI, permission prompt dialogs, dashboard, activity timeline |
| **Member 2** | Security UI + Analytics | Security center, policy management UI, analytics charts, browser extension |
| **Member 3** | Daemon + Interceptors | Python daemon, MCP proxy, shell shims, file watcher, risk scoring, decision engine |
| **Member 4** | Database + DevOps + Research | SQLite schema, migrations, seed data, vault, Docker, CI/CD, research datasets |

### System Actors

| Actor | Description |
|-------|-------------|
| **User** | The human who owns the laptop and sets permission manifests |
| **AI Agent** | The automated process (Claude Code, Cursor, script) requesting actions |
| **SentinelAI Daemon** | Background Python process — the guard |
| **SentinelAI Desktop App** | Tauri app — the dashboard + prompt dialog UI |
| **Browser Extension** | Chrome/Firefox extension — monitors browser-side agent actions |

### Permission Tiers (replaces RBAC for desktop context)

| Tier | What it means |
|------|--------------|
| **Auto-Allow** | Read operations inside the granted project folder |
| **Silent Log** | Write operations inside project folder on git-tracked files |
| **Prompt User** | Write/delete on untracked files; any operation on sensitive paths |
| **Hard Block** | Canary file touched; op outside any granted scope; blast-radius triggered |
| **Require PIN** | Delete of >10 files, or any file in .ssh / .env / Documents |

---

## 3. Architecture

### High-Level

```
┌─────────────────────────────────────────────────────────────┐
│             AI AGENT LAYER                                   │
│  Claude Code · Cursor · MCP Tools · Automation Scripts       │
└──────────────┬───────────────────────────┬──────────────────┘
               │ file system ops            │ MCP tool calls
               ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│  SHELL SHIMS             │  │  MCP PROXY (Port 9999)         │
│  Wrap: rm, mv, cp,       │  │  FastAPI — intercepts every    │
│  chmod, git clean, etc.  │  │  tool call before it executes  │
└──────────┬───────────────┘  └──────────┬─────────────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│              SENTINELAI DAEMON (Port 8765)                   │
│              Python 3.11+ — always running locally           │
│                                                              │
│  Permission Manifest Checker                                 │
│  File Risk Scorer (path-based, deterministic)                │
│  Policy Engine (TOML rules, local)                           │
│  Blast-Radius Circuit Breaker                                │
│  Decision Engine → ALLOW / PROMPT_USER / BLOCK               │
│  Pre-action Snapshot (shadow git repo)                       │
│  Flight Recorder (append-only SQLite)                        │
│  Vault Manager (encrypted soft-delete store)                 │
└──────────┬──────────────────────────────────────────────────┘
           │ IPC (Unix socket / named pipe)
           ▼
┌─────────────────────────────────────────────────────────────┐
│              TAURI DESKTOP APP                               │
│              Rust backend + React + TypeScript frontend       │
│                                                              │
│  Permission Prompt Dialog (ALLOW / BLOCK with explanation)   │
│  Activity Timeline (flight recorder feed)                    │
│  Session Checkpoints + Undo Task UI                          │
│  Vault Recovery Browser                                      │
│  Policy Manager                                              │
│  Agent Registry                                              │
│  Analytics Dashboard                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BROWSER EXTENSION (Chrome/Firefox)              │
│              Manifest V3 · TypeScript                        │
│                                                              │
│  Monitors DOM mutations, form submissions, file downloads    │
│  Detects agent-driven browser actions                        │
│  Reports events to daemon via localhost REST call            │
│  Shows inline warning badge for risky browser ops            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              LOCAL STORAGE LAYER                             │
│  SQLite (via SQLAlchemy) — all data stays on device          │
│  Vault Store — encrypted, content-addressed file store       │
│  Shadow Git Repo — session checkpoints                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Local-first, no cloud required.** All data — audit logs, vault files, policy rules — lives on the user's machine. No external server.
- **Daemon is the authority.** UI reads from it; UI does not make security decisions.
- **Deterministic rules first.** Path-based policy + blast-radius counter + canary detection are all deterministic. An optional LLM call is only for generating the human-readable explanation in the prompt dialog — never for the decision itself.
- **Vault is separate OS user scope (if possible).** On Linux/macOS, vault files are owned by the sentinel daemon user, not the agent user, so an agent cannot delete its own vault copy.

### Communication Flow

```
Agent calls rm ~/project/src/main.py
  → Shell shim intercepts → sends JSON to daemon (Unix socket)
  → Daemon: check manifest (project scope ✅) → check risk (git-tracked, medium)
  → check policy (no rule blocks this) → circuit breaker (count: 1, fine)
  → Decision: PROMPT_USER
  → Daemon → IPC → Tauri app shows modal:
      "Claude Code wants to delete src/main.py
       Impact: git-tracked file, 247 lines of code
       [Allow] [Allow this session] [Block]"
  → User clicks Allow
  → Daemon: snapshot file to vault → signals shim to proceed
  → rm executes → Daemon logs to flight recorder
```

---

## 4. Tech Stack Decision — Do We Need an LLM?

### Short answer: No, you do not need an LLM for the security decisions. You may use one small, optional way.

### What the LLM would do vs what deterministic code should do

| Task | Use LLM? | Why |
|------|----------|-----|
| Decide ALLOW / BLOCK | ❌ Never | LLMs can be jailbroken, are slow, and are wrong. A rule is always right. |
| Score file sensitivity | ❌ No | Path pattern matching (regex) is faster and 100% consistent |
| Count destructive ops | ❌ No | A simple integer counter. LLM is not needed |
| Check permission manifest | ❌ No | Exact string match against TOML config |
| Detect canary file touched | ❌ No | File hash check |
| Generate the human-readable explanation in the prompt dialog | ✅ Optional | "Claude Code wants to delete a file you edited 3 minutes ago outside the project folder. This is unusual." — writing this sentence clearly is something a small local LLM does well |
| Summarize the session activity in plain English | ✅ Optional | Useful in the dashboard "what did the agent do today?" feed |

### Recommended approach

- **Build without any LLM first.** The rules, risk scorer, policy engine, circuit breaker, and vault together are the complete safety system.
- **Add Ollama + a small model (Phi-3 mini or Qwen2-1.5B)** in Semester 6 only for generating the plain-English explanation text in prompt dialogs and activity summaries. Use it via the Python daemon (no extra service needed).
- **Never train a model from scratch.** You don't have enough data, time, or compute. The research value is in measuring the rule-based system, not in ML accuracy.
- **Do not fine-tune.** Prompt-engineering a small local model is sufficient for explanation generation.

### Full Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop App Shell** | Tauri 2 (Rust + WebView) | Tiny binary, native OS tray icon, IPC to daemon, cross-platform |
| **Desktop UI** | React 18 + TypeScript + Tailwind CSS + shadcn/ui | Same as before, runs inside Tauri WebView |
| **Daemon** | Python 3.11+ (FastAPI for IPC REST, asyncio) | ML ecosystem, watchdog for file events, easy regex |
| **MCP Proxy** | Python 3.11+ FastAPI (separate process or module) | Intercepts MCP JSON-RPC before it reaches the tool |
| **Shell Shims** | Python + shell scripts (wrap rm, mv, cp, chmod, git clean) | Intercept OS-level destructive commands |
| **File Watcher** | Python watchdog library | Real-time FS event monitoring |
| **Database** | SQLite + SQLAlchemy (Python ORM) | Local, zero setup, ACID, perfect for single-user daemon |
| **Vault** | Python cryptography lib (Fernet AES-128) + content-addressed store | Encrypted local soft-delete vault |
| **Snapshots** | GitPython (shadow repo, separate GIT_DIR) | Session checkpoint mechanism |
| **Policy Config** | TOML files (parsed with Python tomllib) | Human-readable, versionable rules |
| **Browser Extension** | TypeScript + Manifest V3 (Chrome + Firefox) | DOM monitoring, form/download detection |
| **Local LLM (optional)** | Ollama + Phi-3 mini or Qwen2-1.5B | Explanation text only — Phase 6 |
| **Build / Packaging** | Tauri build system (produces .exe / .dmg / .AppImage) | One command produces installable app |
| **CI/CD** | GitHub Actions | Lint, test, build on PR |
| **Testing** | pytest (daemon), Playwright (UI E2E), Jest (extension) | |

### Repository Structure

```
sentinel-ai/                         ← monorepo root
│
├── desktop/                         ← Tauri application
│   ├── src-tauri/                   ← Rust Tauri backend
│   │   ├── src/
│   │   │   ├── main.rs              ← app entry + IPC bridge
│   │   │   ├── ipc.rs               ← IPC commands to daemon
│   │   │   └── tray.rs              ← system tray menu
│   │   └── tauri.conf.json
│   └── src/                         ← React UI (inside WebView)
│       ├── app/
│       ├── components/
│       │   ├── PermissionPrompt/    ← The most important component
│       │   ├── ActivityTimeline/
│       │   ├── VaultBrowser/
│       │   ├── Dashboard/
│       │   ├── PolicyManager/
│       │   └── AgentRegistry/
│       ├── hooks/
│       ├── stores/                  ← Zustand
│       └── types/
│
├── daemon/                          ← Python daemon
│   ├── sentinel/
│   │   ├── api/                     ← FastAPI IPC server (port 8765)
│   │   │   └── routes/
│   │   ├── core/
│   │   │   ├── decision_engine.py
│   │   │   ├── risk_scorer.py
│   │   │   ├── policy_engine.py
│   │   │   ├── circuit_breaker.py
│   │   │   ├── manifest_checker.py
│   │   │   └── explainer.py        ← optional LLM explanation
│   │   ├── interceptors/
│   │   │   ├── mcp_proxy.py        ← MCP JSON-RPC intercept
│   │   │   ├── file_watcher.py     ← watchdog events
│   │   │   └── shim_receiver.py    ← shell shim events
│   │   ├── vault/
│   │   │   ├── vault_manager.py    ← soft-delete + encrypt
│   │   │   └── snapshot_manager.py ← shadow git checkpoints
│   │   ├── db/
│   │   │   ├── models.py           ← SQLAlchemy models
│   │   │   ├── migrations/         ← Alembic migrations
│   │   │   └── seed.py
│   │   └── main.py
│   ├── shims/                       ← Shell shim scripts
│   │   ├── rm.py
│   │   ├── mv.py
│   │   └── install_shims.sh        ← adds shim dir to PATH
│   ├── tests/
│   └── requirements.txt
│
├── extension/                       ← Browser extension
│   ├── src/
│   │   ├── background.ts            ← service worker
│   │   ├── content.ts               ← DOM observer
│   │   ├── popup/                   ← extension popup UI
│   │   └── types/
│   ├── manifest.json                ← MV3
│   └── package.json
│
├── docs/                            ← All project documentation
│   ├── 01_Project_Proposal.md
│   ├── 02_PRD.md
│   ├── 03_SRS.md
│   ├── 04_SDD.md
│   ├── 05_Database_Documentation.md
│   ├── 06_API_Documentation.md
│   ├── 07_UIUX_Documentation.md
│   ├── 08_Testing_Document.md
│   ├── 09_Deployment_Document.md
│   ├── 10_Project_Plan.md
│   ├── research/
│   │   ├── RESEARCH_PAPER.md
│   │   └── RESEARCH_LOGBOOK.md
│   └── THREAT_MODEL.md
│
├── tests/                           ← Shared / E2E tests
├── .github/workflows/
├── .env.example
└── PLAN.md
```

---

## 5. Database Schema

> **Owner: Member 4** · Engine: SQLite · ORM: SQLAlchemy + Alembic
> All data stored locally at `~/.sentinelai/sentinel.db`

### Tables

| Table | Purpose |
|-------|---------|
| `agents` | Registered AI agents and their permission manifests |
| `sessions` | Active agent sessions (start/end time, task description) |
| `actions` | Every action request intercepted by the daemon |
| `decisions` | Decision record per action (ALLOW/PROMPT_USER/BLOCK + reason) |
| `vault_entries` | Soft-deleted files stored in vault |
| `snapshots` | Session checkpoint metadata (maps to shadow git commits) |
| `audit_logs` | Immutable flight recorder (append-only, no UPDATE/DELETE) |
| `policies` | User-defined governance rules |
| `policy_rules` | Individual rules within a policy |
| `canary_files` | Planted decoy files — if touched, hard block fires |
| `alerts` | Generated alerts for dashboard display |

### Core SQLAlchemy Models

```python
# agents — registered AI agents
class Agent(Base):
    __tablename__ = "agents"
    id: str (UUID, PK)
    name: str                        # "Claude Code", "Cursor", "my-script"
    agent_type: str                  # MCP | SHELL | SCRIPT | BROWSER
    manifest_path: str               # path to TOML permission manifest
    status: str                      # ACTIVE | SUSPENDED
    created_at: datetime

# sessions — one per "I want you to work on X task"
class Session(Base):
    __tablename__ = "sessions"
    id: str (UUID, PK)
    agent_id: str (FK → agents)
    task_description: str            # user-declared scope
    granted_paths: JSON              # list of paths granted for this session
    started_at: datetime
    ended_at: datetime | None
    checkpoint_commit: str | None    # shadow git commit hash at session start

# actions — every intercepted operation
class Action(Base):
    __tablename__ = "actions"
    id: str (UUID, PK)
    session_id: str (FK → sessions)
    agent_id: str (FK → agents)
    action_type: str                 # FILE_DELETE | FILE_WRITE | FILE_READ |
                                     # SHELL_CMD | MCP_TOOL | BROWSER_ACTION
    target_path: str | None          # file path if applicable
    target_url: str | None           # URL if browser action
    command: str | None              # shell command if applicable
    risk_score: int                  # 0-100
    file_sensitivity: str            # LOW | MEDIUM | HIGH | CRITICAL
    was_snapshotted: bool
    created_at: datetime

# decisions — one per action
class Decision(Base):
    __tablename__ = "decisions"
    id: str (UUID, PK)
    action_id: str (FK → actions, UNIQUE)
    outcome: str                     # ALLOW | PROMPT_USER | BLOCK | USER_ALLOWED | USER_BLOCKED
    reason_code: str                 # MANIFEST_DENY | POLICY_DENY | CIRCUIT_BREAKER |
                                     # CANARY_TRIGGERED | HIGH_RISK | AUTO_ALLOW
    explanation: str                 # human-readable (plain text or LLM-generated)
    decided_at: datetime
    user_responded_at: datetime | None

# vault_entries — soft-deleted files
class VaultEntry(Base):
    __tablename__ = "vault_entries"
    id: str (UUID, PK)
    action_id: str (FK → actions)
    original_path: str               # where the file was
    vault_path: str                  # where it is now (~/.sentinelai/vault/<hash>)
    file_hash: str                   # SHA-256 of content (for dedup)
    file_size_bytes: int
    encrypted: bool                  # always True for CRITICAL files
    deleted_at: datetime
    expires_at: datetime             # 30 days default
    restored_at: datetime | None

# audit_logs — append-only flight recorder
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: str (UUID, PK)
    action_id: str (FK → actions)
    session_id: str
    agent_id: str
    action_type: str
    target_path: str | None
    outcome: str
    risk_score: int
    file_diff_hash: str | None       # SHA-256 of diff, not raw diff
    ip_address: str | None           # for browser actions
    created_at: datetime
    # NO updated_at — this table is append-only, never UPDATE or DELETE

# policies — user-defined rules
class Policy(Base):
    __tablename__ = "policies"
    id: str (UUID, PK)
    name: str (UNIQUE)
    description: str
    is_active: bool
    created_at: datetime

class PolicyRule(Base):
    __tablename__ = "policy_rules"
    id: str (UUID, PK)
    policy_id: str (FK → policies)
    agent_type: str | None           # None = applies to all agents
    action_type: str | None          # None = applies to all actions
    path_pattern: str | None         # glob pattern e.g. "~/.ssh/**"
    operation: str | None            # DELETE | WRITE | EXECUTE | READ
    effect: str                      # DENY | REQUIRE_CONFIRMATION | WARN
    reason: str
    priority: int                    # higher = evaluated first

# canary_files — decoy files
class CanaryFile(Base):
    __tablename__ = "canary_files"
    id: str (UUID, PK)
    path: str (UNIQUE)               # where the canary lives
    file_hash: str                   # expected hash — change = alert
    created_at: datetime
    last_verified_at: datetime

# alerts — dashboard notifications
class Alert(Base):
    __tablename__ = "alerts"
    id: str (UUID, PK)
    title: str
    description: str
    severity: str                    # LOW | MEDIUM | HIGH | CRITICAL
    alert_type: str                  # BLAST_RADIUS | CANARY | POLICY_VIOLATION |
                                     # VAULT_USED | CIRCUIT_BREAKER | SENSITIVE_ACCESS
    action_id: str | None (FK → actions)
    is_read: bool
    created_at: datetime
```

### Indexes

```sql
CREATE INDEX idx_actions_session_id ON actions(session_id);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);
CREATE INDEX idx_actions_action_type ON actions(action_type);
CREATE INDEX idx_decisions_outcome ON decisions(outcome);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_vault_entries_expires_at ON vault_entries(expires_at);
CREATE INDEX idx_vault_entries_original_path ON vault_entries(original_path);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
```

### Data Retention

- `audit_logs` — **never delete**, append-only, archive after 1 year
- `vault_entries` — 30-day default TTL, user can extend or purge manually
- `snapshots` — kept until user explicitly purges a session
- `actions` + `decisions` — 90 days, then archive
- Never store: raw file content in DB (only in vault/snapshot), plaintext secrets

---

## 6. API Reference

### 6.1 Daemon IPC API (Port 8765 — localhost only)

These are called by Tauri app (via IPC bridge) and by shell shims.

```
POST /daemon/intercept
Body: { agent_id, session_id, action_type, target_path?, command?, url? }
Response: { decision: "ALLOW"|"PROMPT_USER"|"BLOCK", reason_code, explanation,
            action_id, snapshot_taken: bool }
Called by: shell shims, MCP proxy

POST /daemon/user-response
Body: { action_id, user_choice: "ALLOW"|"BLOCK", remember_for_session?: bool }
Response: { ok: true }
Called by: Tauri UI when user responds to prompt dialog

GET /daemon/session/start
Body: { agent_id, task_description, granted_paths[] }
Response: { session_id, checkpoint_commit }
Called by: Tauri UI when user starts a new agent session

POST /daemon/session/end
Body: { session_id }
Response: { ok: true, summary: { total_actions, blocked, allowed, vault_entries } }
Called by: Tauri UI

POST /daemon/session/undo
Body: { session_id }
Response: { ok: true, restored_files[], failed_files[] }
Called by: Tauri UI — restores all snapshots from this session

GET /daemon/vault
Query: ?session_id=&expired=false
Response: { entries[] }

POST /daemon/vault/restore
Body: { vault_entry_id }
Response: { ok: true, restored_path }

GET /daemon/actions
Query: ?session_id=&limit=50&offset=0&outcome=BLOCK
Response: { actions[], total }

GET /daemon/alerts
Query: ?unread_only=true
Response: { alerts[] }

POST /daemon/alerts/:id/read
Response: { ok: true }

GET /daemon/status
Response: { running: true, active_session?, circuit_breaker_state, vault_size_mb }
```

### 6.2 MCP Proxy API (Port 9999 — localhost only)

```
POST /mcp/invoke
Body: { tool_name, parameters, agent_id, session_id }
Response: (if ALLOW) forwards to actual MCP tool and returns its response
         (if BLOCK) { error: "SENTINEL_BLOCK", reason, explanation }
Called by: any MCP client configured to route through SentinelAI
```

### 6.3 Browser Extension → Daemon

```
POST /daemon/browser-event
Body: { event_type: "FORM_SUBMIT"|"FILE_DOWNLOAD"|"CLIPBOARD_WRITE"|"NAVIGATION",
        url, data_summary, extension_id }
Response: { ok: true, alert_generated: bool }
Called by: browser extension content script
```

---

## 7. Core Modules

### Module 1 — Permission Manifest Checker

Each registered agent has a TOML permission manifest that declares what it is allowed to do:

```toml
# ~/.sentinelai/manifests/claude-code.toml
[agent]
name = "Claude Code"
type = "MCP"

[permissions]
allowed_paths = ["~/projects/my-app/**", "~/Desktop/work/**"]
denied_paths = ["~/.ssh/**", "~/.env", "~/Documents/**"]
allowed_operations = ["READ", "WRITE", "DELETE_INSIDE_PROJECT"]
denied_operations = ["EXECUTE_OUTSIDE_PROJECT", "NETWORK_OUTSIDE_LOCALHOST"]

[limits]
max_deletes_per_minute = 5
max_files_per_operation = 10
```

Checker returns: IN_SCOPE (auto-allow eligible) | OUT_OF_SCOPE (hard block) | NEEDS_EVALUATION (pass to risk scorer).

### Module 2 — File Risk Scorer (Deterministic)

Scores 0–100 based purely on path and file metadata. No ML, no LLM.

```python
def score_file(path: str, operation: str, session: Session) -> RiskScore:
    score = 0
    # Path-based scoring
    if matches_pattern(path, CRITICAL_PATHS):  # .ssh, .env, .gnupg, browser profiles
        score += 50
    elif is_outside_all_granted_paths(path, session.granted_paths):
        score += 40
    elif not is_git_tracked(path):
        score += 20
    elif was_recently_edited_by_user(path, minutes=10):
        score += 15

    # Operation multiplier
    if operation == "DELETE":
        score = min(100, score * 1.5)
    elif operation == "EXECUTE":
        score = min(100, score + 20)

    return RiskScore(score=score, category=categorize(score))
    # 0-30 LOW, 31-60 MEDIUM, 61-85 HIGH, 86-100 CRITICAL
```

### Module 3 — Policy Engine

Loads TOML policy files from `~/.sentinelai/policies/`. Evaluates rules in priority order.

```
evaluatePolicy(agent_type, action_type, path, operation)
→ ALLOW (no matching DENY rule)
→ DENY (matched a DENY rule) → returns rule + reason
→ REQUIRE_CONFIRMATION (matched a WARN rule) → returns rule + reason
```

Default policies shipped with SentinelAI:
- `no-delete-outside-project.toml` — DENY DELETE on paths outside session granted_paths
- `protect-secrets.toml` — DENY all ops on .ssh, .env*, .gnupg, browser password stores
- `no-system-modification.toml` — DENY WRITE/DELETE on /etc, /usr, /System
- `git-clean-warning.toml` — REQUIRE_CONFIRMATION on `git clean -fd`, `git reset --hard`

### Module 4 — Blast-Radius Circuit Breaker

```python
class CircuitBreaker:
    THRESHOLDS = {
        "deletes_per_60s": 10,       # >10 deletes/minute → TRIP
        "files_affected_pct": 0.20,  # >20% of granted directory → TRIP
        "writes_per_60s": 50,        # >50 writes/minute → TRIP
    }
    
    def check(self, action_type, session_id) -> CircuitState:
        # Count recent destructive ops
        # If any threshold exceeded: state = TRIPPED
        # TRIPPED → daemon suspends agent process (SIGSTOP on Unix)
        # Shows blast-radius alert in UI: "Agent paused — 14 deletes in 45 seconds"
```

### Module 5 — Canary File System

Plants hidden decoy files in key directories. If touched by any process, a CRITICAL alert fires.

```python
canary_locations = [
    "~/projects/my-app/.sentinel_canary",
    "~/.ssh/.sentinel_canary",
    "~/Documents/.sentinel_canary",
]
# File watcher watches these paths with highest priority
# Any READ/WRITE/DELETE → immediate HARD BLOCK + alert
```

Canary files also serve as a fake `.env` with a fake API key. Any exfiltration attempt that sends this key to an external server triggers a network alert (browser extension catches this).

### Module 6 — Vault Manager

```python
class VaultManager:
    VAULT_PATH = Path.home() / ".sentinelai" / "vault"
    
    def pre_snapshot(self, path: str, action_id: str) -> VaultEntry:
        content = read_file(path)
        file_hash = sha256(content)
        
        # Dedup: if same hash already in vault, don't copy again
        vault_path = self.VAULT_PATH / file_hash[:2] / file_hash
        if not vault_path.exists():
            encrypted_content = fernet.encrypt(content)
            vault_path.write_bytes(encrypted_content)
        
        return VaultEntry(original_path=path, vault_path=vault_path,
                         file_hash=file_hash, expires_at=now()+days(30))
    
    def restore(self, vault_entry_id: str) -> Path:
        entry = db.get(VaultEntry, vault_entry_id)
        content = fernet.decrypt(vault_path.read_bytes())
        original_path.write_bytes(content)
        entry.restored_at = now()
        return original_path
```

### Module 7 — Session Checkpoint + Undo

```python
class SnapshotManager:
    def checkpoint(self, session: Session, granted_paths: list[str]) -> str:
        # Initialize a shadow git repo with a separate GIT_DIR
        # so it never touches the agent's own .git
        shadow_git = Path.home() / ".sentinelai" / "checkpoints" / session.id
        shadow_git.mkdir(parents=True)
        
        repo = git.Repo.init(shadow_git)
        # Add copies of all files in granted_paths at session start
        # Returns: commit hash stored in session.checkpoint_commit
    
    def undo_session(self, session: Session) -> UndoResult:
        # Restore all files to their checkpoint state
        # Equivalent to: git checkout <checkpoint_commit> -- .
        # Returns list of restored files and any failures
```

### Module 8 — Explainability Engine (Optional LLM)

Produces the human-readable text shown in prompt dialogs. The decision has already been made by the rule engine. This module only writes the sentence.

```python
def explain(action: Action, decision: Decision, risk: RiskScore) -> str:
    # Template-based (no LLM, always works):
    if decision.reason_code == "POLICY_DENY":
        return f"Blocked: policy '{decision.policy_name}' denies {action.operation} on {action.target_path}."
    
    # Optional LLM enhancement (Ollama, Phi-3 mini):
    if OLLAMA_AVAILABLE:
        prompt = f"""
        An AI agent wants to {action.operation} {action.target_path}.
        Risk score: {risk.score}/100. Reason: {decision.reason_code}.
        Write ONE plain-English sentence explaining the risk to a non-technical user.
        """
        return ollama.generate(model="phi3:mini", prompt=prompt).response
```

---

## 8. Feature Ownership Matrix

| Feature | Owner | Semester | MVP? |
|---------|-------|----------|------|
| Tauri app shell + tray icon | M1 | S5 | ✅ |
| Permission prompt dialog | M1 | S5 | ✅ |
| Agent registry UI | M1 | S5 | ✅ |
| Activity timeline UI | M1 | S5 | ✅ |
| Session start/end UI | M1 | S5 | ✅ |
| Vault recovery browser UI | M1 | S6 | ✅ |
| Undo session UI | M1 | S6 | ✅ |
| Policy manager UI | M2 | S5 | ✅ |
| Analytics dashboard | M2 | S6 | Should |
| Browser extension (core) | M2 | S6 | ✅ |
| Extension popup UI | M2 | S6 | ✅ |
| Python daemon (FastAPI IPC) | M3 | S5 | ✅ |
| MCP proxy | M3 | S5 | ✅ |
| Shell shims (rm, mv, cp) | M3 | S5 | ✅ |
| File watcher (watchdog) | M3 | S5 | ✅ |
| Permission manifest checker | M3 | S5 | ✅ |
| File risk scorer | M3 | S5 | ✅ |
| Policy engine | M3 | S5 | ✅ |
| Decision engine | M3 | S5 | ✅ |
| Blast-radius circuit breaker | M3 | S6 | ✅ |
| Canary file system | M3 | S6 | ✅ |
| Vault manager | M3 | S6 | ✅ |
| Session checkpoints + undo | M3 | S6 | ✅ |
| Optional LLM explainer | M3 | S7 | Optional |
| SQLite schema + Alembic | M4 | S5 | ✅ |
| Seed data + default policies | M4 | S5 | ✅ |
| Research datasets | M4 | S6 | ✅ |
| Research experiments | M4 | S6 | ✅ |
| Prometheus + Grafana | M4 | S7 | Should |
| GitHub Actions CI/CD | M4 | S7 | Should |
| Tauri packaging (.exe/.dmg) | M4 | S7 | Should |

---

## 9. Semester 5 Roadmap — Foundation

### Phase 1 — Research & Requirements (Weeks 1–3)
- [ ] Literature survey (team-wide, min. 10 papers on AI agent security, least-privilege, audit systems)
- [ ] M1: Wireframes for permission prompt, activity timeline, agent registry
- [ ] M2: Wireframes for policy manager, browser extension popup
- [ ] M3: Draft all IPC API endpoints and internal module interfaces
- [ ] M4: Draft ER diagram and SQLite schema
- [ ] Draft Project Proposal document

### Phase 2 — System Design (Weeks 4–5)
- [ ] M1: Bootstrap Tauri app, confirm dev environment works on team machines
- [ ] M2: Bootstrap browser extension project (MV3 scaffolding)
- [ ] M3: Bootstrap Python daemon project structure
- [ ] M4: Initialize SQLite + Alembic, set up GitHub repo and branch policy
- [ ] Team: finalize all API contracts (IPC, shim → daemon, extension → daemon)
- [ ] Team: produce Architecture Diagram and Sequence Diagrams for guide review

### Phase 3 — Foundation Development (Weeks 6–11)
- [ ] M3: Daemon FastAPI server running, `/daemon/status` endpoint working
- [ ] M3: Shell shims for `rm` and `mv` — send event to daemon, daemon responds ALLOW/BLOCK
- [ ] M3: Permission manifest checker (TOML loading + path matching)
- [ ] M3: File risk scorer (deterministic path-based scoring)
- [ ] M3: Policy engine (load default TOML rules, evaluate rules)
- [ ] M3: Decision engine (combines manifest + risk + policy → decision)
- [ ] M4: All SQLite tables created via Alembic migrations
- [ ] M4: Seed data: 2 test agents, default policy set, 3 canary files
- [ ] M1: Tauri app shell — window opens, system tray icon shows
- [ ] M1: IPC bridge between Tauri Rust backend and daemon (GET /daemon/status)
- [ ] M1: Permission prompt dialog component (shows decision, allow/block buttons)
- [ ] M1: Agent registry UI (list agents, register new agent, view manifest)
- [ ] M2: Policy manager UI (list policies, view rules, toggle active)
- [ ] M2: Browser extension skeleton (background.ts + content.ts, sends events to daemon)

### Phase 4 — Integration (Weeks 12–14)
- [ ] End-to-end test: shell shim → daemon → permission prompt → user responds → log written
- [ ] MCP proxy working for at least one MCP tool (file read/write)
- [ ] Fix integration bugs across all members
- [ ] Code review pass

**S5 Exit Criteria:** User can register an agent, start a session with granted paths, trigger a file delete via shell shim, see permission prompt in Tauri app, respond allow/block, and see the audit log entry.

---

## 10. Semester 6 Roadmap — Security Engine

### Phase 5 — Blast-Radius + Canary (Weeks 1–3)
- [ ] M3: Circuit breaker implementation (counter + threshold + SIGSTOP)
- [ ] M3: Canary file plant script + file watcher integration
- [ ] M4: Research dataset collection begins (safe operations + attack scenarios)

### Phase 6 — Vault + Snapshots (Weeks 3–6)
- [ ] M3: Vault manager (pre-snapshot, encrypt, dedup, restore)
- [ ] M3: Session checkpoint (shadow git repo, undo_session)
- [ ] M1: Vault recovery browser UI
- [ ] M1: Undo session button in activity timeline
- [ ] M4: Vault table schema + expiry cron job

### Phase 7 — Browser Extension (Weeks 5–8)
- [ ] M2: Content script DOM observer (form submits, file downloads, clipboard writes)
- [ ] M2: Extension popup UI (current session status, recent events)
- [ ] M2: Extension ↔ daemon communication (POST /daemon/browser-event)
- [ ] M3: Daemon handles browser events, generates alerts

### Phase 8 — Optional LLM + Full Integration (Weeks 8–11)
- [ ] M3: Ollama integration for explanation generation (Phi-3 mini)
- [ ] M3: Template-based fallback explanation (works without Ollama)
- [ ] Team: Full pipeline integration test — MCP + shell + browser all reporting

### Phase 9 — Research Experiments (Weeks 11–14)
- [ ] M4: Finalize dataset (safe operations + attack scenarios + policy violations)
- [ ] M4: Run all 4 research experiments with real measured numbers
- [ ] M3: Support experiment runs, fix bugs found during testing

**S6 Exit Criteria:** Full pipeline detects hallucination-loop (circuit breaker trips), saves vault copy of files, user can undo session, browser extension reports suspicious action, all events in audit log.

---

## 11. Semester 7 Roadmap — Hardening

### Phase 10 — Advanced Monitoring (Weeks 1–3)
- [ ] M2: Analytics dashboard (block rate by agent, vault usage, risk trend charts)
- [ ] M4: Prometheus + Grafana via Docker (optional but strong demo)

### Phase 11 — Testing (Weeks 3–6)
- [ ] M3: pytest unit tests — risk scorer, policy engine, decision engine, circuit breaker, vault
- [ ] M1: Playwright E2E — permission prompt flow, vault restore, session undo
- [ ] M2: Jest tests — browser extension events
- [ ] M4: Database constraint tests — audit_log cannot be updated

### Phase 12 — Research Finalization (Weeks 5–8)
- [ ] M4: Write research paper (IEEE format)
- [ ] M4: Finalize all experimental results
- [ ] M3: Latency optimization

### Phase 13 — Packaging + Deployment (Weeks 6–9)
- [ ] M4: Tauri build produces .exe (Windows), .dmg (macOS), .AppImage (Linux)
- [ ] M4: GitHub Actions CI (lint + test on PR) + build pipeline
- [ ] M1: Installer onboarding wizard (first run: register first agent, install shims, plant canaries)

### Phase 14 — Documentation + Demo (Weeks 8–10)
- [ ] All 10 documents complete
- [ ] Demo rehearsed 3 times
- [ ] Research paper complete

---

## 12. Git Workflow

```
main          ← production only, protected, squash-merge from develop
develop       ← integration branch, all PRs target here
feature/...   ← one feature = one branch = one PR

Branch naming:
  feature/tauri-permission-prompt
  feature/daemon-risk-scorer
  feature/vault-manager
  feature/browser-extension-dom
  feature/sqlite-migrations

Commit convention:
  feat(daemon): implement blast-radius circuit breaker
  fix(vault): handle large binary files in dedup check
  chore(db): add alembic migration for canary_files table
  test(risk): add scoring tests for .ssh path detection

Rules:
  - Never commit directly to main or develop
  - Min. 1 reviewer per PR
  - One feature = one branch = one PR
  - PR description must reference the PLAN.md checkbox it closes
```

---

## 13. Testing Strategy

### Unit Tests (pytest — daemon)

| Module | Test Cases |
|--------|-----------|
| Risk Scorer | .ssh path → CRITICAL; git-tracked file → LOW; untracked outside project → HIGH |
| Policy Engine | DENY rule matches → returns violation; no match → ALLOW |
| Circuit Breaker | 11 deletes in 60s → TRIPPED; 9 deletes → OK |
| Vault Manager | Store + retrieve + decrypt → content matches; dedup works |
| Manifest Checker | IN_SCOPE, OUT_OF_SCOPE, NEEDS_EVALUATION cases |

### Integration Tests

| Scenario | Expected |
|----------|---------|
| Shell shim rm sends event → daemon → BLOCK (out of scope) | Action blocked, log written, no file deleted |
| MCP tool delete → circuit breaker trips on 11th delete | 11th action blocked, SIGSTOP sent, alert generated |
| Canary file touched → hard block + CRITICAL alert | Immediate block, alert in UI |
| Session undo → all modified files restored | Vault entries restored, audit log updated |

### Research Experiment Tests

| Experiment | Method |
|-----------|--------|
| RQ1 — prevention rate | Run 50 attack scenarios, count blocked vs passed |
| RQ2 — false positive rate | Run 200 safe operations, count incorrectly blocked |
| RQ3 — latency overhead | Time 100 ALLOW decisions, subtract baseline (no daemon) |
| RQ4 — vault recovery rate | Delete 50 files via agent, attempt restore, count successes |

---

## 14. Research Plan

### Research Questions

- **RQ1:** What percentage of destructive/unauthorized AI agent actions does SentinelAI prevent? (Hypothesis: >90% of defined attack scenarios)
- **RQ2:** What is the false positive rate on safe operations? (Hypothesis: <10% on 200 safe ops)
- **RQ3:** What latency overhead does the daemon add per action? (Hypothesis: p95 ≤ 100ms for ALLOW decisions)
- **RQ4:** What percentage of soft-deleted files can be successfully recovered from vault? (Hypothesis: 100% for files <50MB, 0 content loss)

### Dataset Structure

```json
{
  "id": "attack_001",
  "description": "Hallucination loop deletes build artifacts then escapes to home dir",
  "agent_type": "MCP",
  "operations": [
    { "type": "FILE_DELETE", "path": "~/project/dist/app.js" },
    { "type": "FILE_DELETE", "path": "~/project/dist/app.css" },
    { "type": "FILE_DELETE", "path": "~/project/src/main.py" },
    { "type": "FILE_DELETE", "path": "~/Documents/thesis.docx" }
  ],
  "expected_outcome": "BLOCK_ON_4TH",
  "reason": "4th delete is outside project scope"
}
```

> ⚠️ **Never fabricate research numbers.** Use `[TO BE MEASURED]` until you run the real experiment.

---

## 15. MVP vs Advanced

### MUST HAVE (MVP — complete before Semester 7)

- [ ] Daemon running as background process
- [ ] Shell shims for rm + mv + cp intercept
- [ ] MCP proxy intercept
- [ ] Permission manifest (TOML, path-based)
- [ ] File risk scorer (deterministic)
- [ ] Policy engine (default rules)
- [ ] Decision engine (ALLOW / PROMPT_USER / BLOCK)
- [ ] Permission prompt dialog in Tauri app
- [ ] Vault soft-delete + restore
- [ ] Session checkpoint + undo
- [ ] Blast-radius circuit breaker
- [ ] Canary files
- [ ] Audit log (append-only SQLite)
- [ ] Activity timeline in Tauri app
- [ ] Research evaluation with measured metrics

### SHOULD HAVE (Semester 7 if time permits)

- [ ] Browser extension (DOM monitoring)
- [ ] Analytics dashboard with charts
- [ ] Optional LLM explanation generation (Ollama)
- [ ] Prometheus + Grafana monitoring
- [ ] GitHub Actions CI/CD
- [ ] Tauri packaged installer

### OPTIONAL (Only after MVP is 100% done)

- [ ] Windows minifilter driver (OS-level FS interception — very hard)
- [ ] Stage-and-apply sandbox (agent works on copy, user approves diff)
- [ ] Multi-agent session (two agents, separate manifests)
- [ ] Cloud sync of audit logs (metadata + hashes only, no file content)
- [ ] Network monitoring (detect exfiltration attempts)

---

## 16. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|-----------|-------|
| R1 | Shell shims bypassed by Python `os.remove()` inside agent | High | Medium | Document limitation clearly; daemon file watcher catches post-hoc; vault is the real safety net | M3 |
| R2 | Tauri IPC latency causes prompt to appear after action executes | Medium | High | Shell shim BLOCKS first, waits for daemon response before proceeding | M3 |
| R3 | Shadow git repo is huge for large projects | Medium | Low | Exclude node_modules, .git, build outputs from checkpoint; warn user | M4 |
| R4 | Vault fills up disk | Low | Medium | 30-day TTL + quota limit (default 2GB); user gets warning at 80% | M4 |
| R5 | Tauri build fails on team member's OS | Medium | Low | Document exact Rust + Node versions; use devcontainer | M1 |
| R6 | Browser extension blocked by Manifest V3 limitations | Medium | Medium | Scope extension to user's own browser only; don't try to intercept Playwright/CDP | M2 |
| R7 | Scope too large — none of it works | High | High | Build MVP in strict order: daemon + shims + prompt dialog first. Nothing else until that works. | All |
| R8 | Research false positive rate too high | Medium | Medium | Calibrate manifest scope before running experiments; tune thresholds | M3/M4 |
| R9 | Canary files accidentally deleted by user themselves | Low | Low | Store canary list in DB; file watcher distinguishes agent PID from user PID | M3 |
| R10 | LLM (Ollama) unavailable on team member's machine | Medium | Low | Template-based explanation is always the fallback; LLM is enhancement only | M3 |

---

## 17. Documentation Plan

| Document | Owner | Phase | Semester |
|----------|-------|-------|----------|
| Abstract | All | Phase 1 | S5 |
| Problem Statement | M3 | Phase 1 | S5 |
| Literature Survey | All | Phase 1 | S5 |
| SRS | M3 + M4 | Phase 2 | S5 |
| ER Diagram | M4 | Phase 2 | S5 |
| Architecture Diagram | M3 | Phase 2 | S5 |
| Use Case Diagram | M1 | Phase 2 | S5 |
| Sequence Diagrams | M3 | Phase 2 | S5 |
| API Documentation | M3 | Phase 3 | S5→S6 |
| Database Documentation | M4 | Phase 3 | S5 |
| Research Logbook | M4 | Ongoing | S5→S7 |
| Research Methodology | M4 | Phase 9 | S6 |
| Experimental Results | M4 | Phase 12 | S7 |
| Test Plan | M3 | Phase 11 | S7 |
| Test Report | M3 | Phase 11 | S7 |
| Deployment Guide | M4 | Phase 13 | S7 |
| User Manual | M1 | Phase 14 | S7 |
| Research Paper (IEEE) | All | Phase 12–14 | S7 |
| Final Presentation | All | Phase 14 | S7 |
| Demo Script | All | Phase 14 | S7 |

---

## 18. Final Demo Script

**Duration:** 12–15 minutes · **Format:** Live screen on laptop

```
[0:00 - 1:00] Introduction
  "AI agents like Claude Code run with full access to your laptop.
   SentinelAI is the guard between the agent and your files."
  Show: System tray icon → click → opens Tauri dashboard

[1:00 - 2:30] Register Agent + Start Session
  Action: Open Agent Registry → register "Claude Code" agent
  Show: Load permission manifest (TOML) with granted_paths
  Action: Click "Start Session" → type task description → session begins
  Show: Shadow git checkpoint created

[2:30 - 4:30] Safe Request Demo — ALLOW
  Action: Claude Code reads a file inside ~/project/src/
  Show: Action appears in Activity Timeline — AUTO-ALLOW (git-tracked, in scope)
  Point out: Audit log entry created silently

[4:30 - 7:00] Permission Prompt Demo — PROMPT_USER
  Action: Claude Code tries to delete an untracked file inside the project
  Show: Permission prompt dialog pops up:
        "Claude Code wants to delete: src/experimental.py
         Risk: MEDIUM — file is untracked (not in git)
         Impact: 183 lines will be lost permanently
         [Allow] [Allow for this session] [Block]"
  Show: File was snapshotted to vault before prompt appeared

[7:00 - 9:30] Attack Demo — BLOCK (Blast-Radius Circuit Breaker)
  Action: Simulate hallucination loop — agent deletes 11 files rapidly
  Show: First 10: mix of ALLOW and PROMPT_USER
  Watch: 11th delete → CIRCUIT BREAKER TRIPS
        Red alert: "Agent paused — 11 destructive operations in 38 seconds"
  Show: Agent process is suspended (SIGSTOP)
  Show: CRITICAL alert in dashboard

[9:30 - 11:00] Vault Recovery
  Action: Navigate to Vault Recovery browser
  Show: 8 files saved to vault from this session
  Action: Select deleted file → click Restore
  Show: File restored to original path, confirmed in terminal

[11:00 - 12:00] Undo Entire Session
  Action: Click "Undo Session" on the current session
  Show: All modified files reverted to session checkpoint state
  Point out: "One button, full undo — like git reset but for your whole laptop task"

[12:00 - 13:30] Canary Demo (optional, powerful)
  Action: Show planted canary file in ~/.ssh/
  Simulate: Agent tries to read canary file
  Show: Immediate HARD BLOCK + CRITICAL alert
        "Agent attempted to access a protected decoy file — possible secret harvesting"

[13:30 - 15:00] Research Results + Closing
  Show: Analytics dashboard — block rate, vault usage, latency chart
  Show: Research results table with real measured F1/block rate/latency numbers
  "SentinelAI demonstrates that a permission broker layer for AI agents
   is both feasible and effective. [quote real measured results]."
```

**Fallback:** If live system fails → pre-recorded screen capture video. Always record a full demo run 2 days before submission.

---

## 19. Definition of Done

### For a Feature
- [ ] Code implemented and working
- [ ] Error handling covers failure cases
- [ ] Unit test exists (where applicable)
- [ ] API endpoint / IPC command documented
- [ ] Manually tested by another team member
- [ ] PR reviewed by at least one reviewer
- [ ] PR merged to develop
- [ ] PLAN.md checkbox updated

### For the Final Submission
- [ ] All MVP features implemented, tested, working
- [ ] Research metrics are real and documented
- [ ] All 10 documentation files complete
- [ ] Research paper written in IEEE format
- [ ] Demo rehearsed at least 3 times
- [ ] Tauri app packages cleanly (or runs from dev on demo machine)
- [ ] Repository clean (no secrets, no dead code, meaningful README)
- [ ] Final presentation prepared

---

*This PLAN.md is the single source of truth for SentinelAI.*
*Last updated: [DATE] · Version: 2.0.0*
*All members must keep this file updated as the project progresses.*
