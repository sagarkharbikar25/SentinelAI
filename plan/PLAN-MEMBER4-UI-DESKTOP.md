# SentinelAI — Member 4 Detailed Master Plan
## Role: Workstation Frontend, 4-Screen UI Architecture & Desktop Tray Avatar
* **Owner:** Member 4 (Frontend & Desktop UI Architect)
* **Academic Timeline:** Semester 6 (4-Screen Workstation, Ask Dialog & Live Daemon Bindings) ➔ Semester 7 (System Tray Avatar, Analyst Interface & Polish)
* **Master Plan References:** `plan/final plan.md` (Sections 5, 14, 17.1–17.4; Phase 4)

---

## 1. Executive Role Summary & Code Ownership

Member 4 is responsible for the entire user experience of SentinelAI: the Next.js 14 desktop workstation UI, styling under the dark industrial "Earthforge" aesthetic, eliminating all static mocks to bind directly with live backend data, implementing the time-critical **Ask Permission Dialog** with auto-deny countdown, and engineering the **Windows System Tray Avatar** that lives in the notification area with stateful facial animations and an on-demand flyout.

### Dedicated Files & Subsystems Owned:
* `frontend/src/app/` — 4 primary workstation screens:
  * `page.tsx` — **Home** (Service status, pending asks, daily summary, coverage panel).
  * `vault/page.tsx` — **Backup Vault** (File tree, version explorer, restore, quota bar).
  * `audit-logs/page.tsx` — **Log & Audit** (Events, Ledger, Alerts, Verify Log, Analyst interface).
  * `lab/page.tsx` — **Test Lab** (Guided VM test flow, live T1–T15 execution matrix).
  * `settings/page.tsx` — **Settings Gear** (Modes, protection map, retention, timeout, avatar name).
* `frontend/src/components/layout/` — `Sidebar.tsx`, `Navbar.tsx`, navigation state, and layout shells.
* `frontend/src/components/PermissionPromptDialog.tsx` — Modal with live countdown and timeout-deny logic.
* `frontend/src/lib/daemon.ts` — TypeScript API client, WebSocket/SSE listeners, and backend pipe bridges.
* `desktop/tray_host.py` — PyQt6 system tray runner, native notifications, and animated avatar tray icon.

---

## 2. Technical Specifications & UI Component Design

### 2.1 Consolidated 4-Screen Workstation Layout
Per Master Plan v5 Section 17.1, the sidebar is strictly restricted to **4 primary views + ⚙ Settings**:

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│  SENTINEL AI    │ [Avatar: "Aegis"]  Status: Watching · Mode: Ask [Pause]│
├─────────────────┼────────────────────────────────────────────────────────┤
│ 🏠 Home         │ ⚠️ WAITING FOR YOU (1 Pending Action):                 │
│ 🗄️ Backup Vault │ Claude Code wants to delete: D:/Projects/core/auth.ts  │
│ 📜 Log & Audit  │ Risk: CRITICAL (92) · Backed Up: YES (v3)              │
│ 🧪 Test Lab     │ [ Deny (Default) ]  [ Allow Once ]  Auto-deny in: 0:24 │
│                 ├────────────────────────────────────────────────────────┤
│                 │ TODAY'S ACTIVITY:                                      │
│                 │ 18 Changed · 4 Deleted · 4 Backed Up · 0 Unrecoverable │
│                 ├────────────────────────────────────────────────────────┤
│ ⚙️ Settings     │ COVERAGE: Claude Code (Full Hook) · Antigravity (Deep) │
└─────────────────┴────────────────────────────────────────────────────────┘
```

#### Detailed Screen Specifications:
1. **Home (`/`)**:
   * **Service Health Header**: Animated status indicator (*Guarding*, *Backing Up*, *Needs You*, *Paused*, *Offline*).
   * **Pending Asks Panel**: Prominently highlights actions requiring human decision. Displays target path, deleting agent, risk badge, and a real-time countdown clock.
   * **Today's Activity Digest**: Real-time counter of changed files, deletions, vault snapshots, and unrecoverable actions.
   * **Agent Coverage Matrix**: Displays active monitored agents (Claude Code, Antigravity, Cursor) and their protection level (Full Holdable vs Sysmon Deep Protect vs Alert-Only).
   * **Pause Toggle**: Emergency pause switch with confirmation dialog.
2. **Backup Vault (`/vault`)**:
   * **Version Explorer**: Drill-down folder view showing all files currently in the vault with their timestamp, size, and SHA-256 hash.
   * **One-Click Restore**: Dual-mode restore buttons:
     * *Restore to Safe Copy* (default): Writes to `{filename}.restored.{timestamp}`.
     * *Overwrite Original*: Requires explicit user confirmation.
   * **Session Restore Points**: List of atomic checkpoints taken before multi-file agent workflows.
   * **Global Quota Bar**: Visual meter showing storage consumption against the 10 GB limit (warns in amber at 80%, red at 95%).
3. **Log & Audit (`/audit-logs`)**:
   * **Three-Tab Organization**:
     * *Events*: Unified chronological flight recorder log with risk scores and tamper hashes.
     * *Permission Ledger*: Table of agent permission requests and decisions (`decided_by`: USER, TIMEOUT_DENY, AUTO_RULE).
     * *Alerts*: High-priority security alerts (BURST, CANARY, SENSITIVE_ACCESS).
   * **Verify Log Action**: Interactive button that triggers backend hash-chain verification and renders a visual tamper badge (*Cryptographically Verified* vs *Tamper Detected at Row X*).
   * **Sentinel Analyst Interface (Phase 8)**: Natural language query box ("What did Claude Code touch yesterday?"). Renders answers with interactive links to exact event IDs.
4. **Test Lab (`/lab`)**:
   * **Guided Testing Flow**: Step-by-step wizard guiding the user through creating a test zone, launching an agent, running destructive commands, and verifying recovery.
   * **T1–T15 Live Matrix**: Interactive matrix displaying tests T1 through T15 with pass/fail badges, SHA-256 hash verification outputs, and linked evidence logs.
5. **⚙ Settings (`/settings`)**:
   * **Mode Selector**: Radio selection between *Ask (Recommended)*, *Observe (Passive)*, and *Strict (Block)*.
   * **Protection Map Manager**: Assign folder paths to *Backup*, *Alert-Only*, or *Ignore*.
   * **Ask Timeout Slider**: Configurable countdown (15s to 120s, default 30s).
   * **Avatar Configuration**: Custom avatar name input (`avatar_name`) and tray animation settings.

### 2.2 Interactive Ask Permission Dialog
When an agent attempts a risky action, a dedicated prompt window appears:
* **Focus & Ergonomics**: Default keyboard focus is placed squarely on **Deny** (prevents accidental approvals if user is typing).
* **Live Countdown Timer**: Animated circular or horizontal countdown bar showing remaining time (e.g., `Auto-deny in 0:28`). When timer hits zero, the dialog dispatches a `TIMEOUT_DENY` signal and closes.
* **Backup Confidence Indicator**: Displays a green shield (`✓ Fully Backed Up in Vault`) or an amber warning (`⚠️ No Prior Copy - Delete is Permanent`).

### 2.3 Windows System Tray Avatar (`desktop/tray_host.py`)
Per Master Plan v5 Section 17.4, the animated avatar lives **in the Windows System Tray**:
* **Tray Icon**: The tray icon itself is the avatar's animated face.
* **Stateful Frames**: Pre-rendered icon frames reflecting service status:
  * *Watching*: Calm facial expression with subtle eye-blink animation.
  * *Backing Up*: Processing animation (spinning or focused eyes).
  * *Needs You*: Alert expression with pulsating amber/red border (pending ask).
  * *Paused / Offline*: Sleeping or disconnected expression.
* **Click Flyout Window**: Clicking the tray icon opens a small, elegant flyout showing the avatar, its user-given name, system stats, and pending prompts. Created on demand and destroyed on close (zero persistent background webview RAM).

---

## 3. Semester 6 Detailed Roadmap (4-Screen UI, Ask Dialog & Bindings)

### Milestone 1: 4-Item Navigation Refactoring
* [ ] Refactor `frontend/src/components/layout/Sidebar.tsx` to strictly include: Home, Backup Vault, Log & Audit, Test Lab, and Settings.
* [ ] Clean up obsolete routes (`/agents`, `/security`, `/tools`, `/scopes`, `/policies`) by merging their functionality into the 4 canonical views.
* [ ] Verify responsive layout under 1080p and laptop resolutions with Earthforge design tokens.

### Milestone 2: Mock Elimination & Live Daemon Bindings
* [ ] Audit `frontend/src/lib/daemon.ts`: eliminate all hardcoded mock arrays.
* [ ] Bind Home screen cards to live backend status endpoints (`/daemon/status`, `/daemon/events`).
* [ ] Implement polling/WebSocket listener for real-time event updates.
* [ ] **Exit Verification**: Trigger a file change on the host; verify that the Home screen counter increments within 500 ms without page refresh.

### Milestone 3: Interactive Ask Dialog with Countdown
* [ ] Build `PermissionPromptDialog.tsx` with high-visibility countdown timer.
* [ ] Implement keyboard shortcuts: `Enter` or `Esc` triggers **Deny**; `Ctrl+A` triggers Allow Once.
* [ ] Wire timeout listener to automatically trigger denial and close modal on expiration.
* [ ] **Exit Verification**: Dispatch a simulated Ask prompt; leave it untouched for 30s; verify modal closes and backend logs `TIMEOUT_DENY`.

### Milestone 4: Vault & Log/Audit Screen Implementation
* [ ] Implement directory tree and file version viewer in `/vault`.
* [ ] Wire "Restore" button to backend restore API, displaying success toasts with destination paths.
* [ ] Build the 3-tab layout in `/audit-logs` and wire the "Verify Log" button to render cryptographic proof badges.
* [ ] **Exit Verification**: Restore a deleted file from the `/vault` UI and verify the file reappears on disk.

---

## 4. Semester 7 Detailed Roadmap (Tray Avatar, Analyst UI & Final Polish)

### Milestone 5: System Tray Avatar Implementation
* [ ] Update `desktop/tray_host.py` to support multi-frame animated icon switching using `QIcon` and `QPixmap`.
* [ ] Create the stateful icon frames for *Watching*, *Backing Up*, *Needs You*, *Paused*, and *Offline*.
* [ ] Implement the on-demand click flyout displaying the user-configured avatar name.
* [ ] Wire native Windows notifications (`plyer`) on HIGH/CRITICAL alerts.
* [ ] **Exit Verification**: Change daemon state from backend; verify that tray icon animates to the new state within 1 second.

### Milestone 6: Test Lab Screen & Analyst Query Interface
* [ ] Build `/lab` screen: interactive step-by-step testing wizard with live T1–T15 status matrix.
* [ ] Integrate the Sentinel Analyst natural language query input in `/audit-logs`.
* [ ] Parse generated Analyst markdown: convert `event_id` citations into clickable links opening the raw event modal.
* [ ] **Exit Verification**: Ask a question in the Analyst box; click a cited event link and verify it navigates to the exact event record.

### Milestone 7: Final Polish & Packaging Support
* [ ] Optimize client bundle size; ensure UI load time is $< 1.5\text{ seconds}$.
* [ ] Assist Member 5 with high-resolution UI screenshots, demo recordings, and presentation slide graphics.

---

## 5. Exit Evidence Deliverables
1. `docs/evidence/phase4/workstation_ui_walkthrough.mp4` — Screen recording demonstrating all 4 primary screens operating on live data.
2. `docs/evidence/phase4/ask_dialog_countdown.png` — Screenshot of active countdown timer in Ask Dialog.
3. `docs/evidence/phase4/tray_avatar_states.png` — Multi-state visual evidence of the system tray avatar.
4. `docs/evidence/phase4/log_verification_ui.png` — Screenshot showing cryptographic hash-chain verification badge.
