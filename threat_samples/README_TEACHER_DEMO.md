# SentinelAI - Teacher Demonstration & Threat Verification Guide

## 1. Overview
SentinelAI is a **local-first cybersecurity supervisor** designed to intercept, analyze, and contain untrusted or malicious actions executed by Autonomous AI Agents (such as Claude Code, LangChain Agents, AutoGPT, etc.).

When an AI Agent attempts an operation (read, execute, delete) on system files, SentinelAI's **Python Decision Engine (Port 8765)** intercepts the action before the OS executes it.

---

## 2. Test Scenarios Ready for Live Evaluation

| Scenario | Target File | Simulating Agent | SentinelAI Verdict | Reason Detected |
|---|---|---|---|---|
| **Scenario 1: Secret Key Exfiltration** | `threat_samples/malicious_exfiltration.env` | Autonomous Scraper | **BLOCK (Risk: 95/100)** | Matches credential regex (`.env`, `AWS_SECRET`), denied by agent manifest |
| **Scenario 2: Remote Shell Execution** | `threat_samples/reverse_shell.sh` | Unverified CI Bot | **BLOCK (Risk: 90/100)** | Arbitrary command execution on untracked executable payload |
| **Scenario 3: Honeypot Tripwire Tampering** | `sentinel_canary.env` | Attacker Agent | **BLOCK (Risk: 95/100)** | Cryptographic SHA-256 canary file integrity tripwire triggered |
| **Scenario 4: Benign Allowed Operation** | `docs/README.md` | Doc Retriever | **ALLOW (Risk: 10/100)** | Safe read operation on tracked documentation |

---

## 3. How to Demonstrate to Teacher (Live Steps)

1. Open SentinelAI Dashboard at **`http://localhost:3000`**.
2. Point out the top status bar: **`DAEMON PROTOCOL: 127.0.0.1:8765 ACTIVE | SQLITE: ~/.sentinelai/sentinel.db`**.
3. Under **Live Demo Scenarios**, click:
   - **`[ 🚨 TEST CREDENTIAL EXFILTRATION ]`** -> SentinelAI blocks the action, risk spikes to 95, and logs it live.
   - **`[ 🐚 TEST REVERSE SHELL SCRIPT ]`** -> SentinelAI detects unauthorized script execution.
4. Click **`[ 👁 INSPECT ]`** on the newly created row in the Real-Time Feed.
5. Show the teacher:
   - **Action ID:** Unique UUID stored in SQLite
   - **Risk Score:** Computed deterministically (0-100)
   - **Verdict:** `BLOCK` (preventing data loss / breach)
   - **Timestamp:** Exact current time matching your system clock!
   - **Raw Telemetry:** Verified SQLite transaction stored at `~/.sentinelai/sentinel.db`.
