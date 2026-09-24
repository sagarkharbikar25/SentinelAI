# SentinelAI — System Architecture & Sequence Diagrams
## Version 2.0 (Desktop Daemon & Interception Architecture)

---

## 1. System Module Architecture

```mermaid
graph TD
    Agent["AI Agent (Claude Code / Cursor / Script)"]
    Shim["Shell Shims (rm, mv in PATH)"]
    MCP["MCP Proxy (Port 9999)"]
    Daemon["SentinelAI Daemon (Port 8765)"]
    
    Manifest["Manifest Checker (TOML)"]
    Risk["File Risk Scorer (Deterministic 0-100)"]
    Policy["Policy Engine (TOML Rules)"]
    Breaker["Circuit Breaker (Burst Limiter)"]
    DecisionEngine["Unified Decision Engine"]
    
    Tauri["Tauri Desktop UI (Member 1)"]
    Prompt["Permission Prompt Dialog (30s)"]
    DB[("SQLite Flight Recorder (sentinel.db)")]

    Agent -->|CLI commands| Shim
    Agent -->|Tool calls| MCP
    Shim -->|POST /daemon/intercept| Daemon
    MCP -->|POST /daemon/intercept| Daemon

    Daemon --> DecisionEngine
    DecisionEngine --> Manifest
    DecisionEngine --> Risk
    DecisionEngine --> Policy
    DecisionEngine --> Breaker

    DecisionEngine -->|If PROMPT_USER| Tauri
    Tauri --> Prompt
    Prompt -->|POST /daemon/user-response| Daemon

    Daemon -->|Append Log| DB
    Daemon -->|ALLOW or BLOCK| Shim
```

---

## 2. Sequence Diagrams

### 2.1 Shell Shim File Deletion Interception (ALLOW / BLOCK)

```mermaid
sequenceDiagram
    autonumber
    actor Agent as AI Agent (Claude Code)
    participant Shim as Shell Shim (rm.py)
    participant Daemon as SentinelAI Daemon (:8765)
    participant Engine as Decision Engine
    participant OS as Host Operating System
    participant DB as SQLite (audit_logs)

    Agent->>Shim: rm ~/project/test.py
    Shim->>Daemon: POST /daemon/intercept {path, op: "DELETE", agent: "claude"}
    Daemon->>Engine: decide(manifest, policy, risk)
    alt Action is Outside Scope or Denied by Policy
        Engine-->>Daemon: Decision(outcome: BLOCK, reason: POLICY_DENY)
        Daemon->>DB: Log Action & Decision (BLOCK)
        Daemon-->>Shim: HTTP 200 {decision: "BLOCK", reason: "POLICY_DENY"}
        Shim-->>Agent: Exit code 1 ("BLOCKED by SentinelAI")
    else Action is In Scope & Low Risk
        Engine-->>Daemon: Decision(outcome: ALLOW, reason: AUTO_ALLOW_SAFE)
        Daemon->>DB: Log Action & Decision (ALLOW)
        Daemon-->>Shim: HTTP 200 {decision: "ALLOW"}
        Shim->>OS: Execute native deletion (/bin/rm)
        OS-->>Shim: Success
        Shim-->>Agent: Exit code 0
    end
```

---

### 2.2 Interactive Permission Prompt Flow (High-Risk Action)

```mermaid
sequenceDiagram
    autonumber
    actor Agent as AI Agent
    participant Shim as Shell Shim (rm.py)
    participant Daemon as SentinelAI Daemon (:8765)
    actor User as Human User
    participant UI as Tauri Desktop App
    participant DB as SQLite (audit_logs)

    Agent->>Shim: rm ~/project/untracked_code.py
    Shim->>Daemon: POST /daemon/intercept
    Daemon->>Daemon: Evaluate Risk -> MEDIUM (untracked file)
    Daemon->>UI: Emit Permission Required Notification
    Daemon->>Daemon: Wait on asyncio.Event (30s timeout)
    UI->>User: Display PermissionPromptDialog
    Note over User, UI: User reviews agent, path, risk score, and diff
    User->>UI: Clicks [Allow Once]
    UI->>Daemon: POST /daemon/user-response {action_id, user_choice: "ALLOW"}
    Daemon->>Daemon: Unblock async event -> USER_ALLOWED
    Daemon->>DB: Log Action (outcome: USER_ALLOWED)
    Daemon-->>Shim: HTTP 200 {decision: "ALLOW"}
    Shim->>Shim: Execute deletion
    Shim-->>Agent: Exit code 0
```
