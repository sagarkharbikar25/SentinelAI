---
phase: sem5-ui
plan: MEMBER4_SEM5_UI_PHASES
role: Member 4 (Workstation Frontend & Desktop UI Architect)
type: execution
autonomous: true
wave: 1
depends_on: []
---

# Semester 5 Frontend & Desktop UI Master Execution Plan
**Role:** Workstation Frontend, 4-Screen UI Architecture & Desktop Integration  
**Objective:** Deliver the clean 4-screen workstation (Home, Backup Vault, Log & Audit, Test Lab + Settings), live daemon bindings (port 8765), interactive Ask Permission Dialog with live countdown, and cryptographic log verification badge.  
**Protocol:** Ponytail (simplest, shortest diffs, native Tailwind & React state) + GSD executor.  
**Constraint:** Work locally on `member-4-ui`; no push without user approval.

---

## Context Files
* `frontend/src/components/layout/Sidebar.tsx` — 4-item canonical navigation + Settings.
* `frontend/src/components/layout/Navbar.tsx` — Status header & mode indicator.
* `frontend/src/components/PermissionPromptDialog.tsx` — Interactive Ask modal with countdown.
* `frontend/src/lib/daemon.ts` — Typed HTTP client for SentinelAI Security Daemon (port 8765).
* `frontend/src/app/page.tsx` — Home screen with live pending asks & service status.
* `frontend/src/app/vault/page.tsx` — Backup Vault explorer & one-click restore.
* `frontend/src/app/audit-logs/page.tsx` — Log & Audit with live "Verify Log" button.
* `frontend/src/app/lab/page.tsx` — Test Lab guided flow & T1–T15 execution matrix.
* `frontend/src/app/settings/page.tsx` — Settings gear (modes, timeout, protection map).

---

## Phases

### Phase 1: Live Daemon Client Integration (`lib/daemon.ts`)
* [x] Audit and harden `frontend/src/lib/daemon.ts`:
  - Target `http://127.0.0.1:8765` directly.
  - Implement `getStatus()`, `getPendingPrompts()`, `respondToPrompt()`, `getActions()`, `getAlerts()`, `verifyLog()`.
  - Remove all broken or hardcoded mock data.

### Phase 2: Consolidated 4-Screen Navigation Shell
* [x] Refactor `frontend/src/components/layout/Sidebar.tsx`:
  - Exactly 4 primary sidebar links:
    1. 🏠 **Home** (`/`)
    2. 🗄️ **Backup Vault** (`/vault`)
    3. 📜 **Log & Audit** (`/audit-logs`)
    4. 🧪 **Test Lab** (`/lab`)
    5. ⚙️ **Settings** (`/settings`)
  - Update `Navbar.tsx` with live daemon heartbeat indicator.

### Phase 3: Interactive Ask Permission Dialog with Live Countdown
* [x] Update `frontend/src/components/PermissionPromptDialog.tsx`:
  - Auto-fetch active prompts from `/daemon/prompts/pending`.
  - Animated 30-second countdown bar with auto-close and auto-deny trigger.
  - Fail-closed focus: Default keyboard focus on **Deny** (`Esc` or `Enter`).
  - Send response via `POST /daemon/user-response`.

### Phase 4: Vault & Log/Audit Screens Implementation
* [x] Create `frontend/src/app/vault/page.tsx`:
  - List vaulted files, timestamps, and deduplicated SHA-256 hashes.
  - "Restore" action triggering safe recovery.
* [x] Update `frontend/src/app/audit-logs/page.tsx`:
  - Events table, decisions ledger, and security alerts.
  - Interactive "Verify Log" button rendering live cryptographic proof badge (`Valid` vs `Tamper Detected`).
* [x] Create `frontend/src/app/lab/page.tsx`:
  - Guided wizard for safe test lab folder.
  - T1–T15 testing matrix with pass/fail badges.
* [x] Create `frontend/src/app/settings/page.tsx`:
  - Mode selector (Ask, Observe, Strict), Ask timeout slider, and protection map.

### Phase 5: Verification & Zero-Error Compilation
* [x] Verify Next.js TypeScript build:
  ```powershell
  cd frontend
  npm run build
  ```
* [x] Verify full repository tests across all members remain 100% green.
