---
phase: sem5-backend
plan: MEMBER1_SEM5_BACKEND_PHASES
type: execution
autonomous: true
wave: 1
depends_on: []
---

# Semester 5 Backend Master Execution Plan
**Role:** Backend Daemon & Core Security Engine  
**Objective:** Deliver a production-grade, tested SentinelAI Python Daemon (Port 8765) with deterministic decision engine, shell interceptors, SQLite audit flight recorder, and Postman API collection.  
**Style & Protocol:** Enforces `/ponytail` (minimalist, zero unneeded code, standard library first) and `/executor` (atomic phase tasks, verification steps, strict success gates).

---

## Context Files
* `daemon/sentinel/config.py` — Daemon path and environment configurations.
* `daemon/sentinel/main.py` — FastAPI application root.
* `daemon/sentinel/api/routes.py` — Daemon REST endpoints and prompt resolution loop.
* `daemon/sentinel/core/decision_engine.py` — Core decision broker.
* `daemon/sentinel/core/risk_scorer.py` — Deterministic 0–100 file risk calculator.
* `daemon/sentinel/core/policy_engine.py` — TOML policy matcher.
* `daemon/sentinel/core/manifest_checker.py` — Agent manifest permission validator.
* `daemon/sentinel/db/models.py` — SQLite SQLAlchemy schema.
* `daemon/shims/` — CLI interception wrappers (`rm.py`, `mv.py`, `cp.py`, `git_clean.py`, `chmod.py`).
* `tests/SentinelAI_Postman_Collection.json` — Postman API specification.

---

## Phase 1: Environment & Directory Isolation
**Goal:** Ensure the daemon initializes reliably on any Windows/Linux host without permission issues or sandbox blocks.

* [x] **Task 1.1** `type="auto"`: Harden `daemon/sentinel/config.py`
  - Ensure `SENTINEL_HOME` supports workspace-relative overrides via `SENTINEL_HOME` or `.env`.
  - Fix `init_sentinel_directories()` with safe permission fallback if `~/.sentinelai` is restricted.
* [x] **Task 1.2** `type="auto"`: Database Initialization Verification
  - Ensure SQLite table creation in `daemon/sentinel/db/database.py` executes without locking errors.
  - Verify seed database (`daemon/sentinel/db/seed.py`) populates baseline security rules.
* **Verification:**
  ```powershell
  python -c "from sentinel.config import init_sentinel_directories; init_sentinel_directories(); from sentinel.db.database import init_db; init_db()"
  ```
* **Done Criteria:** Config and database initialize cleanly without errors. (VERIFIED)

---

## Phase 2: Decision Engine & Risk Scorer Core
**Goal:** Verify deterministic permission evaluation across Manifest, Policies, and Risk Scorer.

* [x] **Task 2.1** `type="auto"`: Manifest Checker Verification
  - Validate glob matching for allowed/denied paths and operation sets (`READ`, `WRITE`, `DELETE`).
* [x] **Task 2.2** `type="auto"`: Risk Scorer Calibration
  - Ensure deterministic 0–100 scoring based on path sensitivity (`.ssh`, `.env*`, system directories) and operation severity.
* [x] **Task 2.3** `type="auto"`: Policy Engine Verification
  - Validate TOML policy rule parsing (`DENY`, `ALLOW`, `REQUIRE_CONFIRMATION`) with priorities.
* [x] **Task 2.4** `type="auto"`: Decision Broker Integration
  - Verify `DecisionEngine.decide()` accurately produces `ALLOW`, `BLOCK`, or `PROMPT_USER`.
* **Verification:**
  ```powershell
  pytest daemon/tests/test_manifest_checker.py daemon/tests/test_risk_scorer.py daemon/tests/test_policy_engine.py daemon/tests/test_decision_engine.py -v
  ```
* **Done Criteria:** All decision engine unit tests pass with 100% green assertions. (VERIFIED - 15 passed)

---

## Phase 3: Daemon API & Async Prompt Resolution (Port 8765)
**Goal:** Ensure robust REST API endpoints and dead-lock free async prompt resolution.

* [x] **Task 3.1** `type="auto"`: Session Lifecycle Endpoints
  - Verify `/daemon/status`, `/daemon/session/start`, and `/daemon/session/end`.
* [x] **Task 3.2** `type="auto"`: Intercept & Action Logging
  - Verify `/daemon/intercept` synchronous response contract (`decision`, `action_id`, `reason_code`).
  - Ensure all actions are persisted to SQLite `audit_logs` table.
* [x] **Task 3.3** `type="auto"`: Async Prompt Resolution Loop
  - Ensure pending prompts in `/daemon/actions` can be resolved via `/daemon/user-response` (`ALLOW` / `BLOCK`).
  - Enforce 30-second timeout auto-block fail-safe.
* [x] **Task 3.4** `type="auto"`: Fix TestClient Concurrency in `daemon/tests/test_api.py`
  - Eliminate synchronous polling lock-ups in test suite.
* **Verification:**
  ```powershell
  pytest daemon/tests/test_api.py -v
  ```
* **Done Criteria:** Daemon API passes all lifecycle, interception, and prompt resolution tests. (VERIFIED - 4 passed)

---

## Phase 4: Shell Interception Shims
**Goal:** Verify CLI shims intercept destructive shell commands before OS execution.

* [x] **Task 4.1** `type="auto"`: Interception Shims Verification
  - Test `rm.py`, `mv.py`, `cp.py`, `git_clean.py`, and `chmod.py` with mock daemon responses.
  - Verify exit codes: exit 0 on ALLOW, non-zero on BLOCK/deny.
* [x] **Task 4.2** `type="auto"`: Shim Installers
  - Verify PowerShell (`install_shims.ps1`) and POSIX (`install_shims.sh`) installer scripts.
* **Verification:**
  ```powershell
  pytest daemon/tests/test_shims.py -v
  ```
* **Done Criteria:** All shell shims correctly intercept commands and adhere to daemon decisions. (VERIFIED - 6 passed)

---

## Phase 5: Postman Collection & Sem 5 Package Finalization
**Goal:** Produce a complete, verified Postman collection and automated test runner for evaluation.

* [x] **Task 5.1** `type="auto"`: Update `tests/SentinelAI_Postman_Collection.json`
  - Cover all active endpoints on port 8765:
    - `GET /daemon/status`
    - `POST /daemon/session/start`
    - `POST /daemon/session/end`
    - `POST /daemon/intercept` (Allow, Block, and Prompt cases)
    - `GET /daemon/actions`
    - `POST /daemon/user-response`
    - `GET /daemon/alerts`
  - Include sample payloads, environment variables (`{{base_url}}`), and pre/post-test assertions.
* [x] **Task 5.2** `type="auto"`: Comprehensive Test Suite Run
  - Run full daemon test suite via `pytest daemon/tests/`.
  - Validate zero errors and clean output.
* **Verification:**
  ```powershell
  pytest daemon/tests/ -v
  ```
* **Done Criteria:** All tests pass, and `tests/SentinelAI_Postman_Collection.json` is verified and ready for import into Postman. (VERIFIED - 29 passed)
