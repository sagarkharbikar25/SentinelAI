# SentinelAI — Daemon IPC API Specifications & Contracts
## Master API Reference · Version 2.0 (Desktop Daemon Edition)

---

## 1. Overview & Architecture

SentinelAI Daemon runs locally at `http://127.0.0.1:8765`. It acts as the local-first authority and permission broker between AI agents (Claude Code, Cursor, scripts, MCP tools) and the host operating system.

All communication from desktop clients (Tauri UI), shell shims (`rm`, `mv`), and proxies uses standardized JSON payloads over HTTP.

---

## 2. Main Interception Endpoint

### `POST /daemon/intercept`
Called by shell shims, MCP proxies, and file watchers before any file operation executes.

**Request Payload:**
```json
{
  "agent_id": "claude-code",
  "agent_type": "SHELL",
  "session_id": "session-uuid-optional",
  "action_type": "FILE_DELETE",
  "operation": "DELETE",
  "target_path": "/Users/developer/project/src/main.py",
  "command": "rm src/main.py"
}
```

**Response Payload (Immediate or after User Response):**
```json
{
  "decision": "ALLOW",
  "action_id": "action-uuid-1234",
  "reason_code": "AUTO_ALLOW_SAFE",
  "explanation": "Action evaluated as low risk.",
  "risk_score": 15,
  "risk_category": "LOW",
  "snapshot_taken": false
}
```

**Outcomes:**
* `ALLOW`: Shim proceeds with native OS command.
* `BLOCK`: Shim aborts command, prints reason to `stderr`, and exits with code `1`.
* `PROMPT_USER`: Daemon holds the connection and waits up to 30 seconds for user input from the Tauri UI.

---

## 3. User Response Endpoint (Tauri UI Bridge)

### `POST /daemon/user-response`
Called by Member 1's Tauri Permission Prompt Dialog when the user makes a choice.

**Request Payload:**
```json
{
  "action_id": "action-uuid-1234",
  "user_choice": "ALLOW",
  "remember_for_session": false
}
```

**Response Payload:**
```json
{
  "ok": true,
  "action_id": "action-uuid-1234",
  "final_outcome": "USER_ALLOWED",
  "message": "Successfully applied user response: ALLOW"
}
```

---

## 4. Session Management

### `POST /daemon/session/start`
Starts a scoped task session for an AI agent with explicitly granted directories.

**Request Payload:**
```json
{
  "agent_id": "claude-code",
  "task_description": "Refactor user authentication service",
  "granted_paths": [
    "~/projects/my-app",
    "~/Desktop/work"
  ]
}
```

**Response Payload:**
```json
{
  "session_id": "sess-uuid-5678",
  "agent_id": "claude-code",
  "task_description": "Refactor user authentication service",
  "granted_paths": [
    "~/projects/my-app",
    "~/Desktop/work"
  ],
  "started_at": "2026-09-23T20:30:00.000Z"
}
```

### `POST /daemon/session/end`
Ends an active session.

**Request Payload:**
```json
{
  "session_id": "sess-uuid-5678"
}
```

---

## 5. UI Feeds & Health

### `GET /daemon/status`
Returns daemon health, circuit breaker state, and active session ID.

**Response:**
```json
{
  "running": true,
  "version": "0.1.0",
  "active_session_id": "sess-uuid-5678",
  "circuit_breaker_state": "CLOSED",
  "vault_size_mb": 0.0
}
```

### `GET /daemon/actions?limit=50&offset=0`
Returns recent actions for Member 1's `ActivityTimeline`.

### `GET /daemon/alerts?unread_only=true`
Returns security alerts for Member 2's `AlertFeed`.
