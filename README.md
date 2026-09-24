# SentinelAI — Local AI Agent Permission Broker & Audit Daemon

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Status](https://img.shields.io/badge/Status-Semester%205%20Foundation-green.svg)]()

> **SentinelAI** is a local-first permission broker and audit layer for AI agents that automate your laptop (Claude Code, Cursor, automation scripts, MCP tools). It does NOT build another AI chatbot — it sits as a security guard between the OS and any autonomous agent, intercepting and controlling operations before they touch the disk.

---

## 🛡️ Core Capabilities

* **Pre-Execution Interception**: Hooks OS file deletions and moves via shell shims (`rm`, `mv`) and MCP JSON-RPC proxy before any file is touched.
* **Deterministic Risk Scoring**: 0–100 deterministic scoring evaluating path sensitivity (`.ssh`, `.env*`), git tracking status, and user modification recency.
* **Human-in-the-Loop Prompts**: High-risk operations hold execution and prompt the user with interactive approval dialogs (30s timeout defaults to block).
* **Policy Governance Engine**: Human-readable TOML policies (`~/.sentinelai/policies/`) defining path boundaries, operation locks, and rate limits.
* **Immutable Flight Recorder**: Append-only SQLite audit log (`~/.sentinelai/sentinel.db`) tracking every request, verdict, and file hash.

---

## 📂 Project Structure

```
SentinelAI/
├── daemon/                          # Python 3.11+ Security Daemon (Member 3)
│   ├── sentinel/
│   │   ├── api/                     # FastAPI IPC server (Port 8765)
│   │   ├── core/                    # Decision engine, manifest checker, risk scorer, policy engine
│   │   └── db/                      # SQLite schema (SQLAlchemy) & audit logs
│   ├── shims/                       # OS shell interceptors (rm, mv)
│   └── tests/                       # Unit & integration test suite
├── desktop/                         # Tauri Desktop App UI (Member 1)
├── extension/                       # Browser Extension MV3 (Member 2)
├── docs/                            # API specs, sequence diagrams, and architecture docs
├── tests/                           # Postman collection & E2E scenarios
├── PLAN.md                          # Master Project Plan (v2.0)
├── PLAN-MEMBER1-FRONTEND-DESKTOP.md # Desktop UI plan
├── PLAN-MEMBER2-FRONTEND-SECURITY.md# Security UI & extension plan
├── PLAN-MEMBER3-BACKEND-DAEMON.md   # Daemon & interceptors plan
└── PLAN-MEMBER4-DATABASE-DEVOPS.md  # Database & DevOps plan
```

---

## 🚀 Quickstart (Backend Daemon)

### 1. Setup Virtual Environment
```bash
cd daemon
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Daemon
```bash
python -m sentinel.main
```
The daemon starts on `http://127.0.0.1:8765`.
Swagger API documentation: `http://127.0.0.1:8765/docs`

### 3. Run Tests
```bash
pytest tests/ -v
```

---

## 📜 Documentation

* [Master Project Plan](PLAN.md)
* [API Contract Specifications](docs/API_CONTRACT_SPECS.md)
* [Architecture & Sequence Diagrams](docs/ARCHITECTURE_AND_SEQUENCE_DIAGRAMS.md)
* [Backend Daemon Documentation](daemon/README.md)