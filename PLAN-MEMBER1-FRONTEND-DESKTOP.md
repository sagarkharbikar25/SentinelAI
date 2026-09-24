# PLAN-MEMBER1 — Frontend Desktop UI Developer
## SentinelAI Desktop Application

**Member:** Frontend UI Developer (Desktop)  
**Git Branch Prefix:** `feature/desktop-*`  
**Tech Stack:** Tauri 2.0 (Rust) + React 18 + TypeScript + Tailwind CSS + shadcn/ui  
**Communication Port:** IPC bridge to daemon (Port 8765)

---

## Quick Reference

| Item | Status |
|------|--------|
| **Primary Responsibility** | Tauri desktop app, permission prompt dialog, activity timeline, vault UI, session management |
| **Secondary** | Undo session UI, agent registry UI, policy manager UI (shared with M2) |
| **Semester 5 Deliverables** | App shell + tray + prompt dialog + registry + timeline + session UI |
| **Semester 6 Deliverables** | Vault recovery browser + undo session UI |
| **Semester 7 Deliverables** | Installer wizard + full packaging |
| **Research Contribution** | Demo recording + user feedback during testing |

---

## Your Components & Modules

### Core Responsibilities

```
SentinelAI Desktop App (Tauri)
├── Window Management
│   ├── Main window (dashboard)
│   ├── System tray icon + menu
│   └── Spawn child windows (prompt dialogs, vault browser)
├── Tauri IPC Bridge
│   ├── Call daemon endpoints (via Rust backend)
│   └── Handle responses + errors
└── React Components
    ├── PermissionPromptDialog (CRITICAL — the prompt)
    ├── ActivityTimeline
    ├── VaultBrowser
    ├── SessionManager
    ├── AgentRegistry
    ├── Dashboard
    ├── PolicyManager (shared UI with M2)
    └── Settings
```

### Critical Component: Permission Prompt Dialog

This is **THE** most important component you'll build. It is the direct user-facing decision interface.

```tsx
// src/components/PermissionPrompt/PermissionPromptDialog.tsx

Props:
  - action: Action object from daemon
  - decision: Decision object (includes reason_code + explanation)
  - riskScore: RiskScore (0-100, category)
  - fileContext: { size, lastModified, isGitTracked, inScope }
  - onAllow: () => void
  - onBlock: () => void
  - onAllowSession: () => void

Display:
  ┌─────────────────────────────────────────────┐
  │  ⚠️  Permission Required                     │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  Agent: Claude Code                         │
  │  Action: DELETE                             │
  │  Target: ~/project/src/main.py              │
  │                                              │
  │  📊 Risk Level: MEDIUM (47/100)             │
  │     → File is untracked (not in git)        │
  │     → File was edited 12 minutes ago        │
  │                                              │
  │  💾 Vault: File snapshot saved (247 lines)  │
  │  🔄 Undo: Session can be undone            │
  │                                              │
  │  Explanation:                                │
  │  Claude Code wants to delete a file you     │
  │  modified recently but haven't committed.   │
  │  This could be a mistake (hallucination).   │
  │                                              │
  ├─────────────────────────────────────────────┤
  │  [ Block ]  [ Allow Once ]  [ Allow Session]│
  └─────────────────────────────────────────────┘

Behavior:
  - Click "Block" → daemon BLOCKS action, shows confirmation in timeline
  - Click "Allow Once" → daemon ALLOWS once, resumes execution
  - Click "Allow for Session" → daemon marks this (agent_id, path_pattern) 
    as auto-allow for rest of session
  - Modal stays on screen 30 seconds, then auto-blocks if no response
```

### Component List (Priority Order)

| Component | Semester | MVP? | Notes |
|-----------|----------|------|-------|
| **PermissionPromptDialog** | S5 | ✅ | Peak complexity — modular, testable, responsive |
| **MainWindow** | S5 | ✅ | Dashboard layout + nav tabs |
| **SystemTray** | S5 | ✅ | Icon + context menu (show app, pause agent, settings, quit) |
| **ActivityTimeline** | S5 | ✅ | Feed of actions (allow/block/vault entries) with infinite scroll |
| **AgentRegistry** | S5 | ✅ | List agents, register new, load manifest, view scope |
| **SessionManager** | S5 | ✅ | Start session UI (pick agent, enter task, select paths) + end session button |
| **PolicyManager** | S5 | ✅ | List policies, toggle active, view rules (shared responsibility with M2) |
| **VaultBrowser** | S6 | ✅ | Show soft-deleted files, restore button, expiry timer |
| **UndoSessionButton** | S6 | ✅ | "Undo this entire session" → restore all files → confirm |
| **AnalyticsDashboard** | S7 | Should | Charts: block rate, vault usage, latency (M2 primary) |
| **SettingsPanel** | S7 | Should | Daemon port, vault TTL, log retention, theme |
| **InstallerWizard** | S7 | Should | First-run onboarding (register Claude Code, plant canaries, install shims) |

---

## Semester 5 — Foundation Phase (Your Deliverables)

### Phase 1: Research & Wireframes (Weeks 1–3)

**Your Tasks:**
- [ ] Wireframe the permission prompt dialog (multiple risk levels: LOW, MEDIUM, HIGH, CRITICAL)
- [ ] Wireframe the activity timeline (scrollable feed of actions)
- [ ] Wireframe the agent registry (add/remove agents, view manifests)
- [ ] Wireframe the session manager (start/end UI)
- [ ] Research Tauri best practices: IPC, WebView, tray integration
- [ ] Identify 3 UI libraries for permisisons prompts (shadcn/ui, Headless UI, Chakra) — recommend shadcn

**Deliverable:** Figma wireframes + design spec document

---

### Phase 2: Setup & Architecture (Weeks 4–5)

**Your Tasks:**
- [ ] Create Tauri project with `cargo create-tauri-app` (or use provided template)
- [ ] Confirm dev environment on your machine (Node.js, Rust, Tauri CLI)
- [ ] Set up React + TypeScript scaffolding inside `src/`
- [ ] Set up Tailwind CSS + shadcn/ui (add to Tauri WebView)
- [ ] Create IPC bridge module (Rust backend calls to daemon on port 8765)
- [ ] Document your Tauri IPC contract with M3

**Deliverable:** Working Tauri app that opens, shows a blank window, system tray icon responds

---

### Phase 3: Core Components (Weeks 6–11)

**Priority 1: Permission Prompt Dialog (Weeks 6–8)**
- [ ] Create `PermissionPromptDialog` component
  - [ ] Accepts decision object from IPC
  - [ ] Displays agent name, action type, target path
  - [ ] Shows risk score (bar chart 0-100) + category badge (LOW/MEDIUM/HIGH/CRITICAL)
  - [ ] Shows file context: size, git status, last edited, scope status
  - [ ] Shows pre-snapshot confirmation: "File backed up to vault ✓"
  - [ ] Three buttons: Block, Allow Once, Allow for Session
  - [ ] 30-second auto-block timeout
  - [ ] Responsive design (test on 1920x1080 and mobile-like sizes)
- [ ] Create unit test (Jest) for dialog state transitions
- [ ] Test on team member's machine

**Priority 2: Main Window & Tray (Weeks 6–9)**
- [ ] Main window layout (sidebar nav, content area, status bar)
- [ ] System tray icon + context menu
  - [ ] Show App
  - [ ] Current Session: `[agent name] - [task] - Pause / Resume`
  - [ ] Settings
  - [ ] Quit
- [ ] Tauri menu system (menu bar on macOS)
- [ ] Dark/light theme support

**Priority 3: Activity Timeline (Weeks 8–10)**
- [ ] Component `ActivityTimeline`
  - [ ] Fetches actions + decisions from daemon via IPC
  - [ ] Infinite scroll (load more as user scrolls down)
  - [ ] Timeline entry format:
    ```
    [ALLOW icon] 2:34 PM — Claude Code deleted src/test.py
    ├─ Risk: MEDIUM (42/100) — untracked file
    ├─ Vault: Backed up ✓
    └─ [View Details] [Restore]
    ```
  - [ ] Filter: All | Blocked | Allowed | Vault Entries | Alerts
  - [ ] Search by path / agent name

**Priority 4: Agent Registry (Weeks 9–11)**
- [ ] Component `AgentRegistry`
  - [ ] List registered agents (table: Name | Type | Status | Manifest | Last Used)
  - [ ] "Register New Agent" button → form (agent name, type dropdown, manifest file upload)
  - [ ] Click agent → modal shows full manifest + edit button
  - [ ] Suspend / Resume agent status
  - [ ] Delete agent (warning: will block its future requests)

**Priority 5: Session Manager (Weeks 9–11)**
- [ ] Component `SessionManager`
  - [ ] "Start New Session" form
    - [ ] Agent dropdown (populated from registry)
    - [ ] Task description (text input, e.g. "Fix login bug in app")
    - [ ] Granted paths (multi-select from filesystem picker, or paste paths)
    - [ ] `[Start Session]` button
  - [ ] Active session display
    - [ ] Agent name, task, granted paths
    - [ ] Time elapsed, file count modified
    - [ ] `[Pause Agent]`, `[Resume Agent]`, `[End Session]` buttons
  - [ ] Call daemon `GET /daemon/session/start` on submit
  - [ ] Periodically poll `GET /daemon/status` to show active session

**Priority 6: Policy Manager UI (Weeks 10–11) — *Shared with M2*
- [ ] Component `PolicyManager`
  - [ ] List all policies (table: Policy Name | Active? | Rule Count | Last Modified)
  - [ ] Toggle policy active/inactive
  - [ ] Click policy → modal shows all rules + edit/add/delete buttons
  - [ ] Create new policy → form (name, description, add rules)
  - [ ] Rule format displayed clearly (agent_type | action_type | path | effect | reason)

---

### Phase 4: Integration (Weeks 12–14)

**Your Tasks:**
- [ ] Connect PermissionPrompt to real daemon response
  - [ ] Shell shim deletes file → daemon sends decision to Tauri app via IPC
  - [ ] Prompt appears → user responds → response sent back to daemon
- [ ] Connect ActivityTimeline to real audit log
  - [ ] Poll `GET /daemon/actions` every 2 seconds
  - [ ] New actions appear in timeline immediately
- [ ] Connect AgentRegistry to real manifest loading
  - [ ] Register new agent → saves manifest to `~/.sentinelai/manifests/`
- [ ] Connect SessionManager to daemon session lifecycle
- [ ] E2E test: start session → trigger delete → prompt appears → block → log recorded → timeline shows it

**Deliverable:** Tauri app fully functional, shell shim integration tested

---

## Semester 6 — Security Engine (Your Deliverables)

### Phase 5–6: Vault + Undo UI (Weeks 1–6)

- [ ] Component `VaultBrowser`
  - [ ] Table: File Name | Original Path | Deleted At | Expires At | Status | Actions
  - [ ] Restore button → calls `POST /daemon/vault/restore` → file restored → confirmation
  - [ ] Download button → download file from vault
  - [ ] Filter: this session | all time | expired soon
  - [ ] Show vault storage usage + quota
- [ ] Component `UndoSessionPanel`
  - [ ] "Undo all changes from this session?" confirmation modal
  - [ ] On confirm → calls `POST /daemon/session/undo`
  - [ ] Show progress: "Restoring 14 files..." with progress bar
  - [ ] Success message: "Session undone. 14 files restored. [View in Vault]"

### Phase 7: Polish & Testing (Weeks 7–14)

- [ ] Playwright E2E tests for all critical flows
  - [ ] Permission prompt accept/block
  - [ ] Start session → end session
  - [ ] Restore from vault
  - [ ] Undo session
- [ ] Performance: ensure UI responds <200ms to daemon IPC calls
- [ ] Accessibility: keyboard navigation, screen reader support (WCAG AA)
- [ ] Cross-platform test: Windows, macOS, Linux

---

## Semester 7 — Hardening (Your Deliverables)

### Phase 13: Installer & Packaging (Weeks 6–9)

- [ ] Create installer wizard component (onboarding on first run)
  - [ ] Step 1: Welcome + intro
  - [ ] Step 2: Install daemon background service
  - [ ] Step 3: Register first agent (Claude Code template)
  - [ ] Step 4: Pick paths to grant (~/projects, ~/Desktop)
  - [ ] Step 5: Confirm canary file planting
  - [ ] Step 6: Done, app ready to use
- [ ] Tauri build configuration
  - [ ] Windows: produces `.exe` installer (NSIS)
  - [ ] macOS: produces `.dmg`
  - [ ] Linux: produces `.AppImage`
- [ ] Test installer on team machines

---

## IPC Contract (Your Interface to M3)

### Tauri Rust Backend → Daemon FastAPI

**All requests are async HTTP to `localhost:8765`**

```rust
// src-tauri/src/ipc.rs

#[tauri::command]
async fn fetch_daemon_status() -> Result<DaemonStatus, String>
  GET localhost:8765/daemon/status
  Returns: { running: bool, active_session_id?, circuit_breaker_state, vault_size_mb }

#[tauri::command]
async fn send_user_response(action_id: String, choice: String) -> Result<(), String>
  POST localhost:8765/daemon/user-response
  Body: { action_id, user_choice: "ALLOW"|"BLOCK", remember_for_session?: bool }

#[tauri::command]
async fn start_session(agent_id: String, task: String, paths: Vec<String>) -> Result<String, String>
  POST localhost:8765/daemon/session/start
  Returns: { session_id, checkpoint_commit }

#[tauri::command]
async fn end_session(session_id: String) -> Result<SessionSummary, String>
  POST localhost:8765/daemon/session/end

#[tauri::command]
async fn fetch_actions(session_id: Option<String>, limit: u32, offset: u32) -> Result<Vec<Action>, String>
  GET localhost:8765/daemon/actions?session_id=&limit=50&offset=0

#[tauri::command]
async fn restore_vault_entry(vault_entry_id: String) -> Result<String, String>
  POST localhost:8765/daemon/vault/restore

#[tauri::command]
async fn undo_session(session_id: String) -> Result<UndoResult, String>
  POST localhost:8765/daemon/session/undo

#[tauri::command]
async fn fetch_vault_entries(session_id: Option<String>) -> Result<Vec<VaultEntry>, String>
  GET localhost:8765/daemon/vault?session_id=

#[tauri::command]
async fn fetch_alerts(unread_only: bool) -> Result<Vec<Alert>, String>
  GET localhost:8765/daemon/alerts?unread_only=true
```

**Error Handling:**
- Daemon offline → show error: "SentinelAI daemon is not running. [Restart]"
- Timeout > 5 seconds → retry once, then fail gracefully
- Always include error message in UI: "Failed to fetch actions: [error text]"

---

## Component Architecture

```
src/
├── components/
│   ├── PermissionPrompt/
│   │   ├── PermissionPromptDialog.tsx (main)
│   │   ├── RiskBadge.tsx (shows MEDIUM/HIGH/CRITICAL with color)
│   │   ├── FileContext.tsx (git status, size, modified time)
│   │   └── VaultConfirmation.tsx (file backed up indicator)
│   │
│   ├── ActivityTimeline/
│   │   ├── ActivityTimeline.tsx (main)
│   │   ├── TimelineEntry.tsx (single action)
│   │   ├── ActionDetails.tsx (modal with full action info)
│   │   └── ActionFilters.tsx (filter bar)
│   │
│   ├── VaultBrowser/
│   │   ├── VaultBrowser.tsx (main)
│   │   ├── VaultTable.tsx
│   │   └── RestoreModal.tsx
│   │
│   ├── SessionManager/
│   │   ├── SessionManager.tsx (main)
│   │   ├── StartSessionForm.tsx
│   │   ├── ActiveSession.tsx
│   │   └── PathPicker.tsx (filesystem picker)
│   │
│   ├── AgentRegistry/
│   │   ├── AgentRegistry.tsx (main)
│   │   ├── AgentTable.tsx
│   │   ├── RegisterAgentModal.tsx
│   │   └── ManifestViewer.tsx
│   │
│   ├── PolicyManager/
│   │   ├── PolicyManager.tsx (main)
│   │   ├── PolicyTable.tsx
│   │   ├── PolicyModal.tsx
│   │   └── RuleEditor.tsx
│   │
│   ├── Dashboard/
│   │   ├── Dashboard.tsx (main)
│   │   └── DashboardLayout.tsx
│   │
│   ├── SystemTray/
│   │   └── TrayMenu.tsx
│   │
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       └── Loading.tsx
│
├── hooks/
│   ├── useDaemon.ts (polling daemon for status/actions)
│   ├── useSession.ts (session state management)
│   └── useNotifications.ts (toast notifications)
│
├── stores/
│   ├── daemonStore.ts (Zustand: daemon status, actions, sessions)
│   ├── sessionStore.ts (Zustand: active session state)
│   └── uiStore.ts (Zustand: UI state, dark mode, etc.)
│
├── types/
│   ├── daemon.ts (Action, Decision, Session, Alert, etc.)
│   ├── ui.ts (component props)
│   └── index.ts (re-exports)
│
├── styles/
│   ├── globals.css (Tailwind)
│   └── components.css (custom)
│
├── utils/
│   ├── formatters.ts (formatFileSize, formatDate, etc.)
│   └── validators.ts (path validation, manifest validation)
│
└── App.tsx (main entry point)
```

---

## Testing Strategy (Your Part)

### Jest Unit Tests (Components)

```
tests/
├── components/
│   ├── PermissionPromptDialog.test.tsx
│   │   - Test each button click (Allow, Block, Allow Session)
│   │   - Test 30-second timeout
│   │   - Test risk score display (0, 50, 100)
│   │   - Test file context rendering (git status, size, modified)
│   │
│   ├── ActivityTimeline.test.tsx
│   │   - Test infinite scroll loading
│   │   - Test filtering (All, Blocked, Allowed, Vault)
│   │   - Test search by path
│   │
│   ├── VaultBrowser.test.tsx
│   │   - Test restore button calls daemon
│   │   - Test expiry timer display
│   │
│   └── SessionManager.test.tsx
│   │   - Test form submission
│   │   - Test path picker
│   │   - Test session end/pause buttons
```

### Playwright E2E Tests

```
tests/e2e/
├── permission-prompt.spec.ts
│   - Trigger delete via shell shim
│   - Prompt appears in 2 seconds
│   - Click Allow → action proceeds
│   - Click Block → action blocked
│
├── vault-restore.spec.ts
│   - Delete file
│   - Go to Vault tab
│   - Click Restore
│   - File exists on disk again
│
├── session-undo.spec.ts
│   - Start session with ~/project granted
│   - Modify 5 files
│   - Click "Undo Session"
│   - All 5 files reverted
│
└── agent-registry.spec.ts
    - Register new agent
    - Load manifest
    - Suspend agent
    - Verify agent appears in dropdown
```

**Test Command:**
```bash
npm run test                 # Jest unit tests
npm run test:e2e             # Playwright E2E
npm run test:coverage        # Coverage report (aim for >80%)
```

---

## Git Workflow (Your Branch Strategy)

**Branch Prefix:** `feature/desktop-*`

```bash
# Create a feature branch
git checkout develop
git pull origin develop
git checkout -b feature/desktop-permission-prompt

# Work locally
npm run dev      # Tauri dev server
npm run test     # Run tests

# Commit with clear messages
git commit -m "feat(desktop): implement permission prompt dialog

- Accept ALLOW, BLOCK, ALLOW_SESSION actions
- Display risk score with visual bar chart
- Show file context (git status, size, modified time)
- Add 30-second auto-block timeout
- Add Jest tests for state transitions

Closes: PLAN.md #Phase 3 Priority 1"

# Push and create PR
git push origin feature/desktop-permission-prompt
# Create PR on GitHub → request review from M3 + M4

# After review approval + CI pass
git checkout develop
git pull origin develop
git merge --squash feature/desktop-permission-prompt
git commit -m "feat(desktop): permission prompt dialog (#42)"
git push origin develop
```

---

## Definition of Done (Your Components)

For each component you complete:

- [ ] Component code written + compiles without error
- [ ] Props interface fully typed in TypeScript
- [ ] Error handling (daemon offline, slow response, etc.)
- [ ] Responsive design (test on 1920x1080, mobile-like viewport)
- [ ] Dark/light theme CSS variables used
- [ ] Accessibility: keyboard navigation, labels, ARIA
- [ ] Unit tests with >80% coverage
- [ ] Manual testing (open Tauri dev, interact with component)
- [ ] Code review by another member (M2 or M3)
- [ ] PR merged to develop
- [ ] PLAN.md checkbox updated

---

## Success Criteria (End of Each Semester)

### Semester 5
- [ ] Tauri app opens and closes without crash
- [ ] Permission prompt dialog is fully functional and styled
- [ ] Activity timeline shows actions in real-time
- [ ] Session start/end flow works end-to-end
- [ ] Agent registry lets you register and view agents
- [ ] All components pass E2E tests
- [ ] Demo: start session → trigger delete → prompt → respond → log recorded

### Semester 6
- [ ] Vault browser shows deleted files
- [ ] Restore button recovers files successfully
- [ ] Undo session button works end-to-end
- [ ] Performance: UI responds in <200ms to daemon IPC

### Semester 7
- [ ] Installer wizard onboards first-time user
- [ ] Tauri build produces working .exe / .dmg / .AppImage
- [ ] App tested on Windows, macOS, Linux
- [ ] All Playwright E2E tests pass
- [ ] Demo is smooth and scripted

---

## Communication with Other Members

### With M3 (Backend/Daemon)

- **IPC Contract:** Finalize by end of Week 5
- **Testing:** Ask M3 to run shell shim tests while your prompt dialog is in dev
- **Integration:** Pair with M3 in Week 12 to integrate real daemon responses
- **Question:** "Can your daemon respond with decision in <1 second?"

### With M2 (Security UI)

- **Shared Component:** PolicyManager UI — coordinate on styling and layout
- **Future:** Analytics dashboard (S6) — M2 owns charts, you own dashboard grid layout
- **Question:** "Should PolicyManager filter rules by agent type in the UI?"

### With M4 (Database)

- **Schema Questions:** Ask M4 to confirm exact Action, Decision, VaultEntry JSON shapes before you build components
- **Seed Data:** Ask M4 for test action/decision objects to test your components offline
- **Question:** "What's the max size of an audit_logs.command field? Should I truncate in UI?"

---

## Resources & Setup

### Dev Environment

```bash
# Prerequisites
- Node.js 18+
- Rust 1.70+
- Tauri CLI: cargo install tauri-cli

# Setup
git clone https://github.com/team/sentinel-ai.git
cd sentinel-ai/desktop
npm install
npm run dev

# This opens Tauri dev window + hot reload
```

### Documentation

- Tauri docs: https://tauri.app/
- React docs: https://react.dev/
- shadcn/ui docs: https://ui.shadcn.com/
- TypeScript handbook: https://www.typescriptlang.org/docs/

### Key Files to Know

- `src-tauri/tauri.conf.json` — app metadata, window config, IPC permissions
- `src-tauri/src/main.rs` — Tauri app entry + IPC command setup
- `src/App.tsx` — React app root
- `tailwind.config.js` — Tailwind + shadcn theme config

---

## Questions to Ask M3 Now

1. **IPC Latency:** What's your expected response time for `/daemon/intercept`? (Target: <500ms)
2. **Permission Prompt Timeout:** Should the app auto-allow or auto-block if user doesn't respond in 30 seconds? (Recommend: auto-block for safety)
3. **Manifest Format:** Is the TOML structure fixed, or can I suggest ergonomic improvements?
4. **Error Codes:** What error codes should I expect from daemon (e.g., `DAEMON_OFFLINE`, `INVALID_SESSION`)? Need full enum.

---

*This is YOUR role plan. Keep this updated as you progress. Reference this document in every PR.*
*Last updated: [DATE] · Version: 1.0*
