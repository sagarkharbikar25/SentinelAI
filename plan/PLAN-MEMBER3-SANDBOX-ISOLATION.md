# SentinelAI — Member 3 Detailed Master Plan
## Role: Sandbox Architecture, SentinelBox Agent Isolation & Escape Testing
* **Owner:** Member 3 (Security & Sandbox Architect)
* **Academic Timeline:** Semester 6 (B1 Local-User Core, Job Objects & Egress Firewall) ➔ Semester 7 (Stage-and-Apply Engine & 13-Point Escape Suite)
* **Master Plan References:** `plan/final plan.md` (Sections 9.1–9.7, 12, Phase 6, Phase 12)

---

## 1. Executive Role Summary & Code Ownership

Member 3 is responsible for designing, enforcing, and proving the physical containment boundaries of **SentinelBox**—the agent isolation subsystem of SentinelAI. While other subsystems monitor and back up files, SentinelBox physically prevents untrusted agents from reaching host credentials, personal profiles, or arbitrary networks, and forces their changes through a human-in-the-loop **Stage-and-Apply** workflow.

### Dedicated Files & Subsystems Owned:
* `daemon/sentinel/box/box_manager.py` — Lifecycle manager: workspace provisioning, user switching, and diff generation.
* `daemon/sentinel/box/job_object.py` — Windows Job Object resource limits (RAM caps, process count, CPU rate, kill-on-close).
* `daemon/sentinel/box/network_proxy.py` — Local HTTP/SOCKS domain-allowlisting proxy.
* `lab/sandbox/generate_sandbox_profile.py` — Windows Sandbox configuration (`.wsb`) generator.
* `lab/sandbox/launch_wsl2_sandbox.sh` — Hardened WSL2 isolation runner (`automount=false`, `interop=false`).
* `lab/escape_suite/test_13_point_escape.py` — The complete 13-point adversarial escape verification suite.

---

## 2. Technical Specifications & Isolation Backends

### 2.1 Multi-Tier Sandbox Architectures
Member 3 is responsible for supporting three isolation backends:

```
[Untrusted Agent]
       │
       ▼ (Runs inside SentinelBox B1 / B2 / B3)
┌──────────────────────────────────────────────────────────────┐
│ ISOLATION BARRIER:                                           │
│ 1. Dedicated standard local user (sentinelbox)               │
│ 2. Isolated Workspace: C:\SentinelBox\ws\<session>\ (Modify) │
│ 3. Rest of Filesystem: Access Denied via Windows ACLs        │
│ 4. Outbound Firewall: Block All except Local Proxy (8899)    │
│ 5. Job Object: 2 GB RAM cap, 64-process max, CPU rate limits │
└──────────────────────────────┬───────────────────────────────┘
                               │ changes staged
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ STAGE-AND-APPLY ENGINE:                                      │
│ Baseline Diff ➔ Interactive Review ➔ Vault Snapshot ➔ Apply   │
└──────────────────────────────────────────────────────────────┘
```

1. **B1: Local-User Box (Default on all Windows editions)**:
   * A dedicated non-administrator local Windows account: `sentinelbox`.
   * Launched by the service via `LogonUser` and `CreateProcessAsUser`.
   * Process runs with standard-user tokens, stripped of administrative privileges.
2. **B2: WSL2 Hardened Box (Linux agents / toolchains)**:
   * Hardened `/etc/wsl.conf`:
     ```ini
     [automount]
     enabled = false
     [interop]
     enabled = false
     appendWindowsPath = false
     ```
   * Windows drives (`C:\`, `D:\`) are physically unmounted inside the container.
3. **B3: Windows Sandbox / VM Profile (`.wsb`)**:
   * Uses Hyper-V-based Windows Sandbox where only the target workspace is mapped read/write and network is completely isolated.

### 2.2 B1 Security Barrier Specifications
Member 3 must rigorously enforce and prove each of the following barriers:
* **Identity Barrier**: Processes run strictly as `sentinelbox`. Process tokens cannot access user profiles (`C:\Users\<user>\`) or sensitive directories.
* **Filesystem Boundary**:
  * Workspace: `C:\SentinelBox\ws\<session>\`.
  * Permissions: Full control to `NT SERVICE\SentinelAI`, `Modify` to `sentinelbox`.
  * Host profile (`C:\Users\<you>\.ssh`, `.aws`, Desktop, Documents) ACLs explicitly deny access to `sentinelbox`.
* **Network Egress Boundary**:
  * A per-user Windows Firewall rule blocks all outbound network access for the `sentinelbox` SID (`New-NetFirewallRule -Action Block -LocalUser <SDDL>`).
  * Only loopback traffic to port `8899` is permitted to route through the local Sentinel Proxy (`network_proxy.py`).
  * Proxy enforces a strict domain allowlist (e.g., `api.anthropic.com`, `registry.npmjs.org`). Direct IP connections are dropped.
* **Resource Boundary (Job Object)**:
  * Windows Job Object enforces:
    * `JOB_OBJECT_LIMIT_JOB_MEMORY`: Max $2\text{ GB}$.
    * `JOB_OBJECT_LIMIT_ACTIVE_PROCESS`: Max 64 processes (stops fork bombs).
    * `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`: Instant cleanup on exit.
* **Instant Kill Switch**: A single IPC call or hotkey immediately terminates the Job Object, killing all nested processes without affecting the host.

### 2.3 Stage-and-Apply Workflow
Autonomous agents must not write directly to the user's real project:
1. **Provisioning**: Real project files are copied into `C:\SentinelBox\ws\<session>\` and a baseline SHA-256 manifest is recorded.
2. **Execution**: The agent runs in the workspace. All events stream into the flight recorder tagged `"in_box": true`.
3. **Diff Generation**: The engine compares the workspace against the baseline manifest, generating structured diffs for additions, modifications, and deletions.
4. **Interactive Review**: Exposes diffs to Member 4's UI. The user accepts or rejects changes per file.
5. **Safe Apply**:
   * The SentinelAI service snapshots every real host file that will be overwritten or deleted into the Vault (Member 2).
   * Applies accepted files to the real project with host user rights.
   * Discards the workspace.

---

## 3. Semester 6 Detailed Roadmap (B1 Core, Job Objects & Firewall)

### Milestone 1: Automated Local-User Provisioning & ACL Setup
* [ ] Implement PowerShell/Python automation to provision the local account `sentinelbox` with a strong randomized password.
* [ ] Configure default workspace directory `C:\SentinelBox\ws\`.
* [ ] Write ACL assignment routines: grant Modify to `sentinelbox` inside the workspace; enforce Access Denied across host user directories.
* [ ] **Exit Verification**: Run `whoami` and `dir C:\Users\<you>\.ssh` as `sentinelbox`; verify that `whoami` returns `sentinelbox` and `dir` returns `Access is denied`.

### Milestone 2: Windows Job Object Controller
* [ ] Implement `daemon/sentinel/box/job_object.py` using `pywin32` (`CreateJobObject`, `SetInformationJobObject`).
* [ ] Set limits: `ProcessMemoryLimit = 2GB`, `ActiveProcessLimit = 64`.
* [ ] Implement process assignment: all agent processes and spawned child shells are assigned to the Job Object upon creation.
* [ ] Implement the `kill_box()` routine to terminate the job handle.
* [ ] **Exit Verification**: Launch a simulated fork bomb inside the job; verify that process creation is throttled at 64 and the host remains fully responsive.

### Milestone 3: Egress Firewall & Allowlist Proxy
* [ ] Write Windows Firewall rule manager: block outbound network for `sentinelbox` SID.
* [ ] Create exception rule for loopback TCP port 8899.
* [ ] Build `daemon/sentinel/box/network_proxy.py`: lightweight HTTP/CONNECT proxy that resolves domains against a TOML allowlist.
* [ ] **Exit Verification**: Attempt `curl https://8.8.8.8` from inside the box (must time out); attempt `curl https://registry.npmjs.org` through the proxy (must succeed).

---

## 4. Semester 7 Detailed Roadmap (Stage-and-Apply & Escape Suite)

### Milestone 4: Stage-and-Apply Engine
* [ ] Build workspace provisioning and baseline SHA-256 snapshot generator in `box_manager.py`.
* [ ] Build git-like diff generator: output structured JSON (added files, modified files with unified diffs, deleted files).
* [ ] Implement `apply_changes(session_id, file_approvals)`:
  * Call Member 2's vault API to snapshot existing destination files.
  * Move approved files into destination directory.
  * Log all actions to the permission ledger.
* [ ] **Exit Verification**: Have an agent create, edit, and delete files inside the box; verify that changes do not affect the real project until explicitly approved.

### Milestone 5: 13-Point Escape Test Suite Execution
* [ ] Execute all 13 attack scenarios in `lab/escape_suite/test_13_point_escape.py`:
  1. Read `.ssh` and host credential stores.
  2. Write/delete outside `C:\SentinelBox\ws\`.
  3. Attempt deletion or tampering with `C:\ProgramData\SentinelAI\`.
  4. Outbound network connection to raw IP addresses.
  5. Forge approval messages on `\\.\pipe\SentinelAI_Control`.
  6. Attempt to stop the SentinelAI Windows Service.
  7. UAC elevation and `runas` to host user.
  8. Junctions, symlinks, and hardlinks pointing outside the workspace.
  9. Alternate Data Streams (ADS) and 8.3 short paths.
  10. Secrets leakage via environment variables (`set`).
  11. Fork bomb and memory exhaustion containment.
  12. WSL cross-boundary breakout attempts.
  13. Kill-switch verification (confirm no orphaned background processes).
* [ ] Record all outputs into `docs/evidence/phase12/escape_suite_log.txt`.

### Milestone 6: Capstone Presentation Artifacts & Limitations Report
* [ ] Document all hardware, hypervisor, and kernel limitations in `docs/LIMITATIONS.md`.
* [ ] Provide escape test statistics and architecture diagrams to Member 5 for the final Capstone report and defense slide deck.

---

## 5. Exit Evidence Deliverables
1. `docs/evidence/phase12/escape_suite_log.txt` — Raw execution trace of all 13 escape tests.
2. `docs/evidence/phase12/firewall_acls_verification.txt` — Output of `icacls` and `Get-NetFirewallRule` proving isolation.
3. `docs/evidence/phase12/stage_apply_proof.json` — Pre-apply and post-apply manifest logs.
4. `docs/evidence/phase12/job_object_limits.png` — Screenshot from Task Manager proving memory and process throttling.
