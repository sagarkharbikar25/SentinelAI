# SentinelAI Local Security Daemon (Semester 5 Foundation)

A local-first permission broker and audit daemon for AI agents automating your machine.
Sits between the OS/tools and agents like Claude Code, Cursor, or shell scripts.

---

## Architecture Overview

```
Agent (Claude Code / Cursor / script)
       │
       ▼
      Shell Shim (rm.py, mv.py, cp.py, chmod.py, git_clean.py in ~/.sentinelai/shims)
       │
       ▼  POST http://127.0.0.1:8765/daemon/intercept
 SentinelAI Daemon
 ├── Manifest Checker  (agent declared scope check)
 ├── Policy Engine     (evaluates ~/.sentinelai/policies/*.toml)
 ├── Risk Scorer       (0–100 deterministic path/git scoring)
 └── Decision Engine   (ALLOW / PROMPT_USER / BLOCK)
       │
       ├── ALLOW        ──> Shim runs native OS command
       ├── BLOCK        ──> Shim aborts with error code 1
       └── PROMPT_USER  ──> Waits for Tauri UI response via POST /daemon/user-response
                                (30s timeout defaults to BLOCK)
       │
       ▼
 SQLite Flight Recorder (~/.sentinelai/sentinel.db -> audit_logs)
```

---

## Quickstart

### 1. Install Dependencies
```bash
cd daemon
python -m venv venv

# On Linux/macOS:
source venv/bin/activate
# On Windows:
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 2. Run the Daemon
```bash
# Direct runner:
python -m sentinel.main

# Or via uvicorn:
uvicorn sentinel.main:app --host 127.0.0.1 --port 8765 --reload
```
Interactive Swagger API documentation will be available at:
👉 `http://127.0.0.1:8765/docs`

---

## Running the Unit Tests
```bash
pytest tests/ -v
```

---

## Installing & Activating Shell Shims

### Linux / macOS
```bash
bash daemon/shims/install_shims.sh
export PATH="$HOME/.sentinelai/shims:$PATH"
```

### Windows (PowerShell)
```powershell
.\daemon\shims\install_shims.ps1
$env:Path = "$HOME\.sentinelai\shims;$env:Path"
```

Once installed, running `rm`, `mv`, `cp`, `chmod`, or `git-clean` in any terminal will automatically be intercepted and verified by the daemon before touching your disk.

### Semester 5 Validation

```bash
pytest tests/ -v
```

The shim tests mock the daemon decision and verify that blocked operations never reach the native filesystem command. The live demo can be run from the repository root with `scripts/test-sentinel.ps1`.

---

## API Reference (Port 8765)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/daemon/status` | Daemon health, active session, circuit breaker status |
| `POST` | `/daemon/intercept` | Intercepts action request; resolves or waits for prompt |
| `POST` | `/daemon/user-response` | Receives ALLOW / BLOCK choice from Tauri modal |
| `POST` | `/daemon/session/start` | Starts agent session with granted directory boundaries |
| `POST` | `/daemon/session/end` | Ends session and returns summary |
| `GET` | `/daemon/actions` | Feed of recent actions for ActivityTimeline |
| `GET` | `/daemon/alerts` | Active alerts for Security Center UI |
| `POST` | `/daemon/alerts/:id/read` | Dismisses or marks alert as read |
