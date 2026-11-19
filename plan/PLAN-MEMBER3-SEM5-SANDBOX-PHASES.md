---
phase: sem5-sandbox
plan: MEMBER3_SEM5_SANDBOX_PHASES
role: Member 3 (Sandbox & Process Isolation Architect)
type: execution
autonomous: true
wave: 1
depends_on: []
---

# Semester 5 Sandbox & Process Isolation Master Plan
**Role:** Sandbox Architecture, SentinelBox Agent Isolation & Test Lab  
**Objective:** Deliver workspace staging with diffs & safe apply (`box_manager.py`), process resource limits (`job_object.py`), egress domain-allowlist proxy (`network_proxy.py`), and scripted chaos test runner (`lab/chaos_agent.py`).  
**Protocol:** Ponytail (simplest, shortest, stdlib first) + GSD executor.  
**Constraint:** Work locally on `member-3-sandbox`; no push without user approval.

---

## Phases

### Phase 1: Stage-and-Apply Workspace Engine
* [x] Implement `daemon/sentinel/box/box_manager.py`:
  - Workspace provisioning under `SENTINEL_HOME / "box_workspaces" / <session_id>`.
  - Baseline SHA-256 snapshot.
  - Diff calculator (added, modified unified diffs, deleted).
  - Safe apply: snapshot host files to Member 2's vault before atomic copy/delete. (VERIFIED)

### Phase 2: Process Resource Limits
* [x] Implement `daemon/sentinel/box/job_object.py`:
  - Enforce memory cap (default 2GB) and process count limit ($\le 64$).
  - Kill-switch to terminate all processes in the job.
  - Graceful fallback on non-Windows/standard user. (VERIFIED)

### Phase 3: Egress Domain Proxy
* [x] Implement `daemon/sentinel/box/network_proxy.py`:
  - Intercept HTTP/CONNECT requests on port 8899.
  - Enforce TOML/JSON domain allowlist (`api.anthropic.com`, `registry.npmjs.org`, etc.).
  - Drop raw IP addresses and unlisted domains. (VERIFIED)

### Phase 4: Test Lab & Chaos Agent
* [x] Implement `lab/chaos_agent.py`:
  - Executes test scenarios (unlink, rmdir, overwrite, mass delete burst).
  - Records ground-truth manifest and checks recovery. (VERIFIED)

### Phase 5: Verification & Zero Regressions
* [x] Create `daemon/tests/test_box.py` & `daemon/tests/test_chaos_agent.py`.
* [x] Run all project tests across Members 1, 2, and 3. (VERIFIED - 44 passed)
