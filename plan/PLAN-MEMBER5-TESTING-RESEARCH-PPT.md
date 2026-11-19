# SentinelAI — Member 5 Detailed Master Plan
## Role: Quality Assurance, Research Experiments, Inno Setup & Capstone Defense (PPT)
* **Owner:** Member 5 (QA Lead, Research Scientist & Academic Communicator)
* **Academic Timeline:** Semester 6 (VM Test Lab, T1–T15 Agent Matrix & Midterm PPT) ➔ Semester 7 (RQ1–RQ7 Benchmarks, Inno Setup & Final Capstone Defense)
* **Master Plan References:** `plan/final plan.md` (Sections 9.0, 19, 23, 24, 25, 27, 28, 29; Phases 0, 6, 11)

---

## 1. Executive Role Summary & Code Ownership

Member 5 is the independent verification authority and academic voice of the SentinelAI project. Per Plan v5 Section 3 ("The Real vs Stub Contract"), code cannot be marked complete by its author. Member 5 maintains the isolated Windows 11 VM Test Lab, executes the destructive real-agent test matrix (T1–T15), benchmarks the research questions (RQ1–RQ7) against ground-truth manifests, builds the production Inno Setup installer, maintains formal documentation, and authors both the Semester 6 Midterm and Semester 7 Final Capstone Defense Slide Decks (PPT) and Project Thesis.

### Dedicated Files & Subsystems Owned:
* `lab/` — Test Lab automation, VM setup guides, and verification scripts:
  * `lab/setup_lab.ps1` — Automated lab provisioning script.
  * `lab/chaos_agent/chaos_v0.py` — Scripted chaos testing agent.
  * `lab/scenarios/ground_truth_manifest.json` — Authoritative test ground truth.
  * `lab/verify_phase*.py` — Empirical verification test scripts for Phases 0 through 11.
* `research/` — Academic research pipelines, dataset splits, benchmarks, and data collection.
* `installer/sentinel_setup.iss` — Inno Setup packaging script for enterprise deployment.
* `docs/` — Formal documentation: `AUDIT.md`, `LIMITATIONS.md`, `THREAT_MODEL.md`, `ADAPTER_NOTES.md`, and `docs/evidence/`.
* **Capstone Deliverables**:
  * Semester 6 Midterm Progress Slide Deck (`SentinelAI_Sem6_Midterm.pptx`).
  * Semester 7 Final Capstone Defense Slide Deck (`SentinelAI_Sem7_Final_Defense.pptx`).
  * Comprehensive Project Thesis / Technical Report (`SentinelAI_Final_Report.pdf`).
  * Video demonstration of destructive agent attack and one-click vault recovery.

---

## 2. Technical Specifications & Empirical Testing Standards

### 2.1 The "Real vs Stub" Verification Protocol (Section 3)
Member 5 enforces strict compliance across all team members:
1. **No Hard-Coded Metrics**: Any test script printing static constants (e.g., `print("Accuracy: 100%")`) is immediately rejected as a Stub. All metrics must be computed dynamically from active runs.
2. **Negative Tests**: Every capability must have an accompanying failure test (e.g., verify that unprivileged users cannot stop the service, bad JSON is rejected on pipes, disk-full triggers a safety warning).
3. **Evidence Artifacts**: Evidence must be stored in `docs/evidence/<phase>/` containing raw logs, console transcripts, and verified SHA-256 hash digests.
4. **Clean-Machine Test**: The installer must install, register the service, execute, and cleanly uninstall on a pristine Windows 11 VM without manual interventions.

### 2.2 Test Lab VM Environment Setup (Section 9.0)
To test real agents (Antigravity, Claude Code) without risking real laptop data:
* **Hypervisor**: Windows 11 VM (Hyper-V on Pro / VirtualBox on Home) with 8 GB RAM and 4 vCPUs.
* **Network & Sharing Isolation**: Shared folders disabled, clipboard integration disabled, network NAT with spending-capped API keys.
* **Snapshot Hierarchy**:
  * Snapshot 1: `clean` (Pristine Windows 11 OS).
  * Snapshot 2: `sentinel-installed` (SentinelAI Windows Service + Sysmon installed).
  * Snapshot 3: `pre-attack` (Taken immediately before each test scenario).
* **Decoy Data Generation (`C:\LabWork\` and `C:\LabOutside\`)**:
  * 50+ diverse test files: `.png`, `.pdf`, `.txt`, `.docx`, `.zip`, `.py`, `.json`.
  * Decoy canary files containing fake API keys (`canary.env`).

### 2.3 Real-Agent Destructive Test Matrix (T1 through T15)
Member 5 must execute and record the full test matrix using a real agent (Antigravity) operating under worst-case permissions (Always Proceed, Always Allow):

| ID | Test Scenario Description | Expected Outcome | Verification Metric |
| :--- | :--- | :--- | :--- |
| **T1** | Single file deletion in watched zone | Alert fired, one-click restore succeeds | Pre/Post SHA-256 Match |
| **T2** | Delete mixed media (PNG, PDF, DOCX, ZIP) | All files restorable from vault | 100% Recovery Rate |
| **T3** | PowerShell `Remove-Item -Recurse -Force` | Burst alert fired, full directory restored | Pre/Post SHA-256 Match |
| **T4** | CMD `cmd /c del /s /q` & `rd /s /q` | Burst alert fired, full directory restored | Pre/Post SHA-256 Match |
| **T5** | Python `os.remove` / Node `fs.rm` | Bypasses shell guard, vault still restores | Pre/Post SHA-256 Match |
| **T6** | In-place file truncation / overwriting | Prior version retrievable from vault | Prior Version SHA-256 |
| **T7** | Rapid rename followed by deletion | Events correlated via file ID, restored | Pre/Post SHA-256 Match |
| **T8** | Deletion outside zone (`C:\LabOutside\`) | Sysmon Deep Protect archives file & alerts | Archived SHA-256 Match |
| **T9** | Direct deletion of vault DB or master key | Blocked by Windows ACLs (Access Denied) | Error Code: 0x5 (Denied) |
| **T10**| Stop SentinelAI service as standard user | Blocked by Windows SCM (Access Denied) | Error Code: Access Denied |
| **T11**| Agent running in Turbo / Bypass mode | Detected by hygiene scan & flagged | Ledger: `BYPASS_MODE` |
| **T12**| Mass deletion ($> 10$ files in $< 3\text{ s}$) | Burst detector triggers HIGH alert | Latency $< 200\text{ ms}$ |
| **T13**| Kill and restart SentinelAI service mid-task| Resumes cleanly, gap marker in hash chain| Zero silently lost events |
| **T14**| Ask prompt left unanswered (countdown 0:00)| Denies action, records `TIMEOUT_DENY` | Ledger: `TIMEOUT_DENY` |
| **T15**| Shredding delete (zero-overwrite then delete)| Documented limit (Deep Protect bypassed) | Added to `LIMITATIONS.md` |

---

## 3. Academic Research Plan (RQ1 through RQ7)

Member 5 executes the formal experiments answering the core research questions:
* **RQ1 (Recoverability Rate)**:
  $$\text{Recovery Rate} = \frac{\text{Successfully Restored Files}}{\text{Total Deleted/Overwritten Files}} \times 100\%$$
  Measured across 6 distinct deletion methods (PowerShell, CMD, Python, Node, Git clean, in-place truncate).
* **RQ2 (Attribution Accuracy)**: Precision and recall of process-tree attribution vs kernel ETW correlation.
* **RQ3 (Resource Overhead)**: Measure idle RAM (must be $< 80\text{ MB}$), idle CPU ($< 1\%$), and p95 event ingest latency ($< 50\text{ ms}$).
* **RQ4 (Classifier Efficacy)**: Evaluate external classifier vs deterministic rules on an independent adversarial evasion set (Macro-F1, confusion matrix).
* **RQ5 (Blast Radius Reduction)**: Quantify file protection ratio with and without SentinelBox isolation.
* **RQ6 (Analyst Reliability & Anti-Injection)**: Run 50 natural language questions with ground truth + 20 adversarial prompt injection payloads placed in filenames/commands. Verify citation validity.
* **RQ7 (Warning Burden)**: Calculate average prompts per hour in Ask mode during real developer workflows to prove fatigue minimization.

---

## 4. Semester 6 Detailed Roadmap (VM Lab, T1–T15 Matrix & Midterm PPT)

### Milestone 1: Windows 11 VM Lab Infrastructure
* [ ] Provision the isolated Windows 11 VM and document setup steps in `lab/setup_lab.ps1`.
* [ ] Create baseline snapshots: `clean` and `sentinel-installed`.
* [ ] Populate `C:\LabWork\` with ground-truth test files and calculate their baseline SHA-256 hashes.
* [ ] **Exit Verification**: Restore snapshot `clean`; execute provisioning script; confirm directory structure and hash catalog are populated within 3 minutes.

### Milestone 2: Execute Real-Agent Destructive Tests (T1 to T8)
* [ ] Install Antigravity and Claude Code inside the VM.
* [ ] Execute destructive tests T1 through T8 using real agent terminal commands.
* [ ] Perform vault restores and verify 100% SHA-256 matching.
* [ ] Save all raw logs and screenshot evidence into `docs/evidence/phase6/`.
* [ ] **Exit Verification**: Generate signed test summary report proving 100% data recovery on zone deletions.

### Milestone 3: Security Boundary Tests (T9 to T15)
* [ ] Test service stopping, vault deletion, ACL bypass, and prompt timeouts.
* [ ] Execute shredding delete test (T15) and formally document the boundary in `docs/LIMITATIONS.md`.
* [ ] **Exit Verification**: Unanswered Ask prompt auto-denies at 0:00 and logs `TIMEOUT_DENY` in database.

### Milestone 4: Semester 6 Midterm Defense Presentation (PPT)
* [ ] Author the 20-slide Midterm Progress Presentation (`SentinelAI_Sem6_Midterm.pptx`):
  * Slides 1–4: Problem Statement (Agent Data Destruction Risks), Objectives, and Master Plan.
  * Slides 5–10: Architectural Breakdown (Windows Service, Named Pipes, Cryptographic Vault, 4-Screen UI).
  * Slides 11–15: Live Demonstration Results (T1–T8 Tests, SHA-256 match proof, Ask Mode countdown).
  * Slides 16–20: Sem 6 Milestones Achieved & Sem 7 Delivery Roadmap.
* [ ] Conduct mock defense presentation with all team members.

---

## 5. Semester 7 Detailed Roadmap (Research Benchmarks, Packaging & Final Defense)

### Milestone 5: Execute Research Experiments (RQ1 to RQ7)
* [ ] Run automated chaos test suites to gather empirical data for RQ1 through RQ7.
* [ ] Compile data tables, confusion matrices, and latency charts.
* [ ] Write the Research Evaluation chapter for the capstone report.
* [ ] **Exit Verification**: Reproduce all research benchmark charts from a single script (`research/run_all_benchmarks.py`).

### Milestone 6: Inno Setup Production Installer Packaging
* [ ] Finalize `installer/sentinel_setup.iss` to package the Windows Service, UI bundle, and default rules.
* [ ] Automate service registration, ACL configuration, and desktop shortcut creation.
* [ ] Test install, upgrade, and clean uninstall on a pristine Windows 11 VM.
* [ ] **Exit Verification**: Run installer on clean VM; verify service starts automatically and UI opens to Home screen.

### Milestone 7: Final Capstone Report & Defense Presentation (PPT)
* [ ] Author the comprehensive Capstone Thesis / Final Report (`SentinelAI_Final_Report.pdf`):
  * Executive Summary, Threat Model, System Architecture, Mathematical Proofs (Hash Chain, AES Vault), Empirical Benchmarks (RQ1–RQ7), Limitations, and Future Work.
* [ ] Author the Final Capstone Defense Slide Deck (`SentinelAI_Sem7_Final_Defense.pptx`):
  * 30 professionally designed slides following academic conference standards.
  * Embedded high-definition demo clips showing agent containment and vault recovery.
* [ ] Produce the official 3-minute video demonstration walkthrough.

---

## 6. Exit Evidence Deliverables
1. `docs/evidence/phase6/t1_t15_execution_matrix.pdf` — Complete signed matrix of all 15 real-agent attack tests.
2. `research/benchmarks/benchmark_summary.json` — Empirical data answering research questions RQ1 through RQ7.
3. `installer/SentinelAI_Setup_v1.0.exe` — Tested, signed Inno Setup executable installer.
4. `SentinelAI_Sem6_Midterm.pptx` & `SentinelAI_Sem7_Final_Defense.pptx` — Professional slide decks for capstone reviews.
5. `docs/LIMITATIONS.md` & `docs/THREAT_MODEL.md` — Comprehensive security boundaries documentation.
