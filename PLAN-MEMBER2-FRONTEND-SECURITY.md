# PLAN-MEMBER2 — Frontend Security UI + Analytics Developer
## SentinelAI Security Center & Browser Extension

**Member:** Security UI + Analytics Developer  
**Git Branch Prefix:** `feature/security-*`  
**Tech Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui (dashboard) · TypeScript + Manifest V3 (extension)  
**Communication Port:** IPC to daemon (Port 8765) + extension ↔ daemon (localhost:8765)

---

## Quick Reference

| Item | Status |
|------|--------|
| **Primary Responsibility** | Security center UI, policy management UI, analytics dashboard, browser extension |
| **Secondary** | PolicyManager UI (shared with M1), alert system, threat detection visualizations |
| **Semester 5 Deliverables** | Security center UI + policy manager + alert notifications |
| **Semester 6 Deliverables** | Browser extension (core) + analytics dashboard (partial) |
| **Semester 7 Deliverables** | Full analytics dashboard with charts + extension polish |
| **Research Contribution** | Analytics collection, threat detection metrics, false positive reporting |

---

## Your Modules & Responsibilities

```
SentinelAI Security Center
├── Security Dashboard
│   ├── Risk heatmap (real-time)
│   ├── Alert feed (unread count, severity badges)
│   ├── Threat summary (blocked actions, policy violations)
│   └── Agent health status
├── Policy Manager
│   ├── Policy list + toggle
│   ├── Rule editor
│   └── Policy creation wizard (shared UI with M1)
├── Analytics Dashboard
│   ├── Block rate chart (over time)
│   ├── Risk distribution chart (pie: LOW/MEDIUM/HIGH/CRITICAL)
│   ├── Vault usage trends
│   ├── Agent performance (actions/minute, block rate)
│   ├── False positive tracking
│   └── Latency percentiles
└── Alert Management
    ├── Alert details modal
    ├── Alert filtering (severity, type, agent)
    └── Auto-dismiss rules

Browser Extension (Chrome/Firefox)
├── Background Service Worker
│   ├── Detect DOM mutations
│   ├── Monitor form submissions
│   ├── Detect file downloads
│   ├── Track clipboard writes
│   └── Report events to daemon
├── Content Script
│   ├── Inject warning badges
│   ├── Monitor agent-driven browser actions
│   └── Communicate with background
└── Extension Popup UI
    ├── Current session status
    ├── Recent browser events
    ├── SentinelAI status
    └── Quick settings
```

---

## Semester 5 — Foundation Phase (Your Deliverables)

### Phase 1: Research & Design (Weeks 1–3)

**Your Tasks:**
- [ ] Research: threat detection UI patterns (malware tools, security dashboards)
  - Study: Wazuh, osquery UI, Splunk, Grok
  - Identify: What makes a threat alert effective vs cluttered?
- [ ] Design security center wireframes
  - [ ] Alert feed (what info per alert?)
  - [ ] Policy manager (how to display complex rules simply?)
  - [ ] Risk indicators (gauge, bar, color coding)
- [ ] Research browser extension limitations (Manifest V3)
  - [ ] What can/can't content script do?
  - [ ] Storage limits, message passing size limits
  - [ ] CSP restrictions
- [ ] Research analytics UI best practices
  - Time-series charts, trend analysis, percentile displays
  - Drill-down interactions

**Deliverable:** Design spec + wireframes + Manifest V3 scoping document

---

### Phase 2: Setup & Architecture (Weeks 4–5)

**Your Tasks:**
- [ ] Confirm Tauri IPC works for receiving alerts + actions
  - [ ] M1 will have IPC bridge; verify you can call same endpoints
- [ ] Create browser extension project scaffold
  ```bash
  mkdir extension
  npm init
  npm install --save-dev esbuild typescript @types/chrome
  ```
- [ ] Create extension directory structure
  ```
  extension/
  ├── src/
  │   ├── background.ts        (service worker)
  │   ├── content.ts           (page script)
  │   ├── popup/
  │   │   ├── popup.html
  │   │   ├── popup.tsx        (React component)
  │   │   └── popup.css
  │   └── types/
  │       └── extension.ts
  ├── public/
  │   ├── manifest.json        (Manifest V3)
  │   ├── popup.html
  │   └── icons/
  ├── tsconfig.json
  └── package.json
  ```
- [ ] Test extension loads in Chrome (load unpacked in `extension/build/`)

**Deliverable:** Extension project setup + Tauri IPC endpoints confirmed

---

### Phase 3: Security Center UI (Weeks 6–11)

#### Priority 1: Alert System (Weeks 6–8)

**Component `AlertFeed`**
- [ ] Real-time alert list (ordered by severity + timestamp)
  ```
  ┌─────────────────────────────────────┐
  │ Alerts (12 new)                     │
  ├─────────────────────────────────────┤
  │ 🔴 CRITICAL   2:34 PM               │
  │ Circuit breaker tripped             │
  │ Claude Code: 14 deletes in 45 sec   │
  │ [View] [Dismiss]                    │
  ├─────────────────────────────────────┤
  │ 🟠 HIGH       2:31 PM               │
  │ Policy violation detected           │
  │ Attempt to access ~/.ssh/id_rsa     │
  │ [View] [Dismiss]                    │
  ├─────────────────────────────────────┤
  │ 🟡 MEDIUM     2:28 PM               │
  │ Canary file accessed                │
  │ ~/.ssh/.sentinel_canary touched     │
  │ [View] [Dismiss]                    │
  └─────────────────────────────────────┘
  ```
  - [ ] Poll `GET /daemon/alerts?unread_only=true` every 3 seconds
  - [ ] Unread count badge on nav tab
  - [ ] Severity color coding (CRITICAL=🔴, HIGH=🟠, MEDIUM=🟡, LOW=🟢)
  - [ ] Click alert → `AlertDetailsModal` opens
  - [ ] Dismiss button → `POST /daemon/alerts/:id/read`
  - [ ] Auto-dismiss after 60 seconds unless HIGH/CRITICAL

**Component `AlertDetailsModal`**
- [ ] Full alert info:
  - Title + description
  - Severity + timestamp
  - Related action (if applicable) → link to timeline
  - Recommended action (e.g. "Review agent manifest" or "Restore from vault")
  - [Close] [Dismiss] buttons

**Component `AlertFilters`**
- [ ] Filter bar (multi-select):
  - [ ] Severity: LOW, MEDIUM, HIGH, CRITICAL
  - [ ] Type: BLAST_RADIUS, CANARY, POLICY_VIOLATION, VAULT_USED, CIRCUIT_BREAKER, SENSITIVE_ACCESS
  - [ ] Agent: [all agents]
  - [ ] Date range: Last hour / Last day / Last week / All time
- [ ] Result count: "Showing 23 of 47 alerts"

#### Priority 2: Security Dashboard Tab (Weeks 8–10)

**Component `SecurityDashboard`**
- [ ] Layout:
  ```
  ┌────────────────────────────────────────────────────────┐
  │  Security Center                                        │
  ├──────────┬──────────┬──────────┬────────────────────────┤
  │ Alerts   │ Policies │ Activity │ Agent Health           │
  ├────────────────────────────────────────────────────────┤
  │                                                          │
  │  📊 Risk Summary                                        │
  │  ├─ Total actions: 342                                  │
  │  ├─ Blocked: 47 (13.7%)    🔴                          │
  │  ├─ Prompted: 89 (26%)     🟡                          │
  │  └─ Allowed: 206 (60%)     🟢                          │
  │                                                          │
  │  🚨 Active Alerts: 3 new                                │
  │  ├─ Circuit breaker tripped (1h ago)                    │
  │  ├─ High-risk file deleted (23m ago)                    │
  │  └─ Sensitive path accessed (2m ago)                    │
  │                                                          │
  │  🛡️  Agent Health                                       │
  │  ├─ Claude Code: HEALTHY (342 ops, 4% blocked)         │
  │  ├─ my-script: SUSPENDED (awaiting review)             │
  │  └─ Cursor: HEALTHY (89 ops, 8% blocked)               │
  │                                                          │
  │  💾 Vault Status                                        │
  │  ├─ Files stored: 34                                    │
  │  ├─ Storage: 2.4 MB / 2 GB (0.1%)                      │
  │  └─ Expiring soon: 3 files                              │
  │                                                          │
  └────────────────────────────────────────────────────────┘
  ```
- [ ] Stat cards (clickable, navigate to relevant section):
  - [ ] Total Actions card
  - [ ] Blocked Actions card
  - [ ] Alerts card
  - [ ] Vault Storage card
  - [ ] Agents card

**Component `RiskSummaryChart`**
- [ ] Donut chart: Actions by outcome (ALLOW, PROMPT_USER, BLOCK)
  - Colors: green for ALLOW, yellow for PROMPT, red for BLOCK
  - On hover: show percentages
  - Click: filter ActivityTimeline to this outcome

**Component `AgentHealthList`**
- [ ] Table: Agent Name | Status | Ops/hr | Block Rate | Last Action | Actions
  - Status: HEALTHY (0% blocked) | WARNING (5-10% blocked) | SUSPENDED
  - Actions column: Suspend | Resume | View Manifest | [...]

#### Priority 3: Policy Manager (Weeks 9–11) — *Shared with M1*

**Component `PolicyManager`**
- [ ] List tab: all policies with toggle active/inactive
  ```
  ┌──────────────────────────────────────────────┐
  │ Policies          [+ New Policy]              │
  ├───────────┬────────────┬──────────┬───────────┤
  │ Name      │ Rules      │ Status   │ Actions   │
  ├───────────┼────────────┼──────────┼───────────┤
  │ Protect   │ 5 rules    │ ✓ Active │ [Edit]    │
  │ Secrets   │            │          │ [Delete]  │
  │───────────┼────────────┼──────────┼───────────┤
  │ No System │ 3 rules    │ ✓ Active │ [Edit]    │
  │ Modify    │            │          │ [Delete]  │
  │───────────┼────────────┼──────────┼───────────┤
  │ Git Clean │ 1 rule     │ ✗ Inactive│ [Edit]   │
  │ Warning   │            │          │ [Delete]  │
  └───────────┴────────────┴──────────┴───────────┘
  ```
- [ ] Details tab: show all rules for a policy
  ```
  Policy: Protect Secrets
  Description: Deny all operations on .ssh, .env*, .gnupg
  
  Rules:
  ┌─────────────────────────────────────────────┐
  │ # │ Applies To        │ Action │ Path      │
  │───┼───────────────────┼────────┼──────────│
  │ 1 │ All agents        │ DENY   │ ~/.ssh/** │
  │ 2 │ All agents        │ DENY   │ ~/.env*   │
  │ 3 │ MCP agents only   │ WARN   │ ~/.gnupg  │
  └─────────────────────────────────────────────┘
  ```
- [ ] Edit rule modal
  - [ ] Path pattern input (glob syntax, with examples)
  - [ ] Operation select (READ, WRITE, DELETE, EXECUTE)
  - [ ] Effect select (DENY, REQUIRE_CONFIRMATION, WARN)
  - [ ] Agent type filter (All, MCP, SHELL, SCRIPT)
  - [ ] Reason text (why this rule exists)
  - [ ] [Save] [Cancel] buttons
- [ ] New policy wizard (modal)
  - [ ] Step 1: Policy name + description
  - [ ] Step 2: Add rules (add 1+ rules, step through each)
  - [ ] Step 3: Review + confirm
  - [ ] Post to daemon: `/daemon/policies/create` (ensure M3 has this endpoint)

---

### Phase 4: Extension Foundation (Weeks 10–14)

**Browser Extension Scaffolding**

- [ ] Create `manifest.json` (Manifest V3)
  ```json
  {
    "manifest_version": 3,
    "name": "SentinelAI",
    "version": "0.1.0",
    "permissions": ["webRequest", "scripting", "activeTab", "storage"],
    "host_permissions": ["<all_urls>"],
    "background": {
      "service_worker": "background.js"
    },
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "run_at": "document_start"
      }
    ],
    "action": {
      "default_popup": "popup.html",
      "default_title": "SentinelAI"
    },
    "icons": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
  ```

- [ ] Create `src/background.ts` (service worker)
  ```typescript
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FORM_SUBMIT") {
      // Report to daemon
      reportToDaemon("FORM_SUBMIT", message.data);
    }
    if (message.type === "FILE_DOWNLOAD") {
      // Report to daemon
      reportToDaemon("FILE_DOWNLOAD", message.data);
    }
  });

  async function reportToDaemon(eventType: string, data: any) {
    try {
      const response = await fetch("http://localhost:8765/daemon/browser-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          url: data.url,
          data_summary: data.data,
          extension_id: chrome.runtime.id
        })
      });
      // Handle response
    } catch (error) {
      console.error("Failed to report to daemon:", error);
    }
  }
  ```

- [ ] Create `src/content.ts` (content script)
  ```typescript
  // Monitor forms, file downloads, clipboard
  
  document.addEventListener("submit", (e: Event) => {
    const form = e.target as HTMLFormElement;
    if (isAgentGenerated(form)) {
      chrome.runtime.sendMessage({
        type: "FORM_SUBMIT",
        data: {
          url: window.location.href,
          formAction: form.action,
          formData: new FormData(form)
        }
      });
    }
  });

  // Monitor downloads
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      // Detect download links clicked by agent
    });
  });
  ```

- [ ] Create extension popup UI (`src/popup/popup.tsx`)
  ```tsx
  export function ExtensionPopup() {
    return (
      <div className="w-80 p-4 bg-white text-sm">
        <h2>SentinelAI Monitor</h2>
        
        <div className="mt-2">
          <p className="font-bold">Daemon Status</p>
          <p>{daemonRunning ? "✓ Running" : "✗ Offline"}</p>
        </div>
        
        <div className="mt-2">
          <p className="font-bold">Active Session</p>
          <p>{sessionName || "None"}</p>
        </div>
        
        <div className="mt-2">
          <p className="font-bold">Recent Events</p>
          <ul className="text-xs">
            {recentEvents.map(e => (
              <li key={e.id}>{e.type} - {e.timestamp}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  ```

---

## Semester 6 — Security Engine (Your Deliverables)

### Phase 7: Browser Extension (Weeks 5–8)

**Complete Extension Implementation**

- [ ] Content script improvements
  - [ ] Detect form submissions (especially API key leaks to external URLs)
  - [ ] Detect clipboard writes (exfiltration detection)
  - [ ] Detect file downloads (watch for suspicious filenames)
  - [ ] Inject warning badges for risky operations
  ```html
  <div class="sentinel-warning">
    ⚠️ SentinelAI Alert: This form submits to external.com
    Proceed? [Allow Once] [Block]
  </div>
  ```

- [ ] Service worker improvements
  - [ ] Maintain list of blocked URLs (from canary files)
  - [ ] Detect exfiltration patterns (API key to external URL)
  - [ ] Rate-limit POST requests (detect data dump)
  - [ ] Report all events to daemon with timestamp

- [ ] Popup UI
  - [ ] Show active session + granted paths
  - [ ] Show recent browser events (last 10)
  - [ ] Show daemon status + connection
  - [ ] Settings button (daemon host, port, enable/disable)

### Phase 8: Analytics Dashboard (Weeks 8–11)

**Component `AnalyticsDashboard`**

- [ ] Time-series chart: Actions over time (hourly buckets)
  - X-axis: time, Y-axis: action count
  - Three lines: ALLOW, PROMPT_USER, BLOCK
  - Interactive: hover shows exact counts + percentages

- [ ] Risk distribution: Pie chart or bar chart
  - Risk scores 0-30 (LOW) | 31-60 (MEDIUM) | 61-85 (HIGH) | 86-100 (CRITICAL)
  - Show action count per category
  - On click: filter timeline to that category

- [ ] Agent performance table
  - Agent Name | Actions | Blocked % | Avg Risk | Last Action
  - Sort by blocked % (highest first)
  - Hover: show agent health indicator

- [ ] Vault usage chart
  - X-axis: time, Y-axis: storage MB
  - Show growth trend
  - Forecast when quota (2GB) will be reached

- [ ] Latency percentiles (p50, p95, p99)
  - Histogram or line chart
  - Show daemon decision latency per action type
  - Help identify bottlenecks

**Component `BlockRateTrend`**
- [ ] Line chart: block rate % over days/weeks
  - Show 7-day or 30-day trend
  - Highlight anomalies (sudden spike in blocks)

**Component `FalsePositiveTracker`** (optional)
- [ ] Track user feedback: "This should have been ALLOWED"
- [ ] Chart: false positive count by rule
- [ ] Help M4 calibrate thresholds

---

## Semester 7 — Hardening (Your Deliverables)

### Phase 11: Testing & Polish (Weeks 3–6)

- [ ] Jest tests for all React components
  - [ ] AlertFeed: test alert rendering, dismiss, filtering
  - [ ] PolicyManager: test rule creation, deletion, toggle active
  - [ ] Analytics components: test chart data loading
- [ ] Extension unit tests (TypeScript)
  - [ ] Manifest V3 validity
  - [ ] Message passing (background ↔ content)
- [ ] E2E extension testing
  - [ ] Load extension in Chrome
  - [ ] Submit form → event reported to daemon
  - [ ] Download file → event reported to daemon

### Phase 12: Analytics Finalization (Weeks 8–11)

- [ ] Add drill-down interactions
  - [ ] Click bar in time-series → show actions for that hour
  - [ ] Click agent in table → show only that agent's analytics
- [ ] Add export functionality
  - [ ] Export analytics as CSV / PDF
  - [ ] Useful for research + audit reports
- [ ] Performance optimization
  - [ ] Lazy-load large charts
  - [ ] Memoize heavy computations

### Phase 13: Research Integration (Weeks 8–11)

- [ ] Work with M4 to collect research metrics
  - [ ] Block rate per scenario
  - [ ] False positive count
  - [ ] Latency histogram
  - [ ] Vault recovery rate
- [ ] Add analytics queries for research
  - [ ] `SELECT COUNT(*) WHERE outcome = 'BLOCK' AND session_id = ?`
  - [ ] `SELECT AVG(latency) WHERE action_type = 'FILE_DELETE'`

---

## IPC Contract (Your Interface to M3)

### Daemon Endpoints You'll Call

```
GET /daemon/alerts?unread_only=true&limit=50
  Returns: { alerts: Alert[] }

POST /daemon/alerts/:id/read
  Body: { }
  Returns: { ok: true }

GET /daemon/actions?outcome=BLOCK&limit=100
  Returns: { actions: Action[], total: int }

GET /daemon/policies
  Returns: { policies: Policy[] }

POST /daemon/policies/create
  Body: { name, description, rules: Rule[] }
  Returns: { policy_id, ok: true }

POST /daemon/policies/:id/update
  Body: { name?, description?, is_active? }
  Returns: { ok: true }

POST /daemon/policies/:id/delete
  Returns: { ok: true }

GET /daemon/analytics/block-rate?from=timestamp&to=timestamp
  Returns: { buckets: { timestamp, allow_count, block_count, prompt_count }[] }

GET /daemon/analytics/risk-distribution
  Returns: { low_count, medium_count, high_count, critical_count }

GET /daemon/agents/health
  Returns: { agents: { name, status, action_count, block_rate, last_action_at }[] }
```

### Browser Extension → Daemon

```
POST /daemon/browser-event
  Body: { event_type, url, data_summary, extension_id }
  Returns: { ok: true, alert_generated: bool }
```

---

## Component Architecture

```
src/
├── components/
│   ├── SecurityDashboard/
│   │   ├── SecurityDashboard.tsx (main)
│   │   ├── AlertFeed.tsx
│   │   ├── AlertDetailsModal.tsx
│   │   ├── RiskSummaryChart.tsx
│   │   ├── AgentHealthList.tsx
│   │   └── AlertFilters.tsx
│   │
│   ├── PolicyManager/
│   │   ├── PolicyManager.tsx (main, shared with M1)
│   │   ├── PolicyList.tsx
│   │   ├── RuleEditor.tsx
│   │   ├── NewPolicyWizard.tsx
│   │   └── RuleTable.tsx
│   │
│   ├── AnalyticsDashboard/
│   │   ├── AnalyticsDashboard.tsx (main)
│   │   ├── TimeSeriesChart.tsx
│   │   ├── RiskDistributionChart.tsx
│   │   ├── AgentPerformanceTable.tsx
│   │   ├── VaultUsageChart.tsx
│   │   ├── LatencyHistogram.tsx
│   │   ├── BlockRateTrend.tsx
│   │   └── FalsePositiveTracker.tsx
│   │
│   └── common/
│       ├── Chart.tsx (wrapper for recharts)
│       ├── Table.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
│
├── extension/
│   ├── src/
│   │   ├── background.ts
│   │   ├── content.ts
│   │   └── popup/
│   │       ├── popup.tsx
│   │       └── popup.html
│   ├── manifest.json
│   └── build/
│
├── hooks/
│   ├── useAlerts.ts (poll daemon for alerts)
│   ├── useAnalytics.ts (fetch analytics data)
│   ├── usePolicies.ts (manage policies)
│   └── useExtensionStatus.ts
│
├── stores/
│   ├── alertStore.ts (Zustand)
│   ├── policyStore.ts (Zustand)
│   ├── analyticsStore.ts (Zustand)
│   └── extensionStore.ts (Zustand)
│
└── types/
    ├── alerts.ts
    ├── policies.ts
    ├── analytics.ts
    └── extension.ts
```

---

## Testing Strategy (Your Part)

### Jest Unit Tests

```
tests/
├── components/
│   ├── AlertFeed.test.tsx
│   │   - Test alert rendering with correct severity colors
│   │   - Test dismiss button calls daemon
│   │   - Test filtering by severity
│   │   - Test infinite scroll loading
│   │
│   ├── PolicyManager.test.tsx
│   │   - Test policy list rendering
│   │   - Test toggle active/inactive
│   │   - Test rule creation form validation
│   │   - Test delete confirmation
│   │
│   └── AnalyticsDashboard.test.tsx
│   │   - Test chart data loading
│   │   - Test chart rendering with mock data
│   │   - Test date range filter
│   │   - Test drill-down interactions
│
├── extension/
│   ├── background.test.ts
│   │   - Test message passing
│   │   - Test daemon communication
│   │
│   └── content.test.ts
│   │   - Test form detection
│   │   - Test badge injection
```

### Playwright E2E Tests

```
tests/e2e/
├── alerts.spec.ts
│   - Alert appears in feed when fired by daemon
│   - Click alert → details modal opens
│   - Dismiss button → alert marked as read
│   - Filter by severity → only matching alerts shown
│
├── policies.spec.ts
│   - Create new policy
│   - Add rule to policy
│   - Toggle policy active/inactive
│   - Edit existing rule
│
├── analytics.spec.ts
│   - Chart data loads from daemon
│   - Time range filter changes chart
│   - Drill-down interaction works
│
└── extension.spec.ts
    - Load extension in Chrome
    - Extension popup shows daemon status
    - Submit form → reported to daemon
```

---

## Git Workflow (Your Branch Strategy)

**Branch Prefix:** `feature/security-*`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/security-alert-system

# Work locally
npm run dev
npm run test

# Commit
git commit -m "feat(security): implement alert feed with real-time updates

- Poll daemon for alerts every 3 seconds
- Display by severity (CRITICAL > HIGH > MEDIUM > LOW)
- Dismiss marks alert as read in daemon
- Add filtering by severity/type/agent
- Add unread count badge on nav

Closes: PLAN.md #Phase 3 Priority 1"

git push origin feature/security-alert-system
# PR → review from M1 + M3 → merge after approval
```

---

## Definition of Done (Your Components)

- [ ] Code written + compiles
- [ ] Props fully typed in TypeScript
- [ ] Error handling (daemon offline, slow response)
- [ ] Responsive design (desktop + tablet)
- [ ] Dark/light theme CSS vars
- [ ] Accessibility: keyboard nav, ARIA labels
- [ ] Unit tests >80% coverage
- [ ] Manual testing by another member
- [ ] Code review approved
- [ ] PR merged to develop
- [ ] PLAN.md checkbox updated

---

## Success Criteria

### Semester 5
- [ ] Security dashboard displays real alerts in real-time
- [ ] Policy manager lets you create and toggle policies
- [ ] All components responsive and styled
- [ ] Extension loads in Chrome without errors
- [ ] Demo: alert fired → appears in feed → dismiss works

### Semester 6
- [ ] Browser extension monitors DOM and reports events
- [ ] Extension popup shows active session + recent events
- [ ] Analytics dashboard displays block rate chart
- [ ] Performance: dashboard loads in <2 seconds

### Semester 7
- [ ] All analytics charts fully functional
- [ ] Extension tested on Chrome + Firefox
- [ ] Research data exported for analysis
- [ ] Demo shows real-time alerts + analytics

---

## Communication

### With M1 (Desktop UI)
- **Shared Component:** PolicyManager UI — coordinate styling + layout
- **Future:** Dashboard integration — M1 builds grid, you add panels
- **Question:** "Should PolicyManager be in a modal or sidebar?"

### With M3 (Backend)
- **Endpoints:** Finalize all analytics queries by end of Week 5
- **Extension:** Confirm daemon listens on localhost:8765 for extension events
- **Question:** "What's max size of alert.description field?"

### With M4 (Database)
- **Schema:** Confirm Alert, Policy, PolicyRule, AuditLog table structures
- **Analytics:** Ask for efficient queries for time-series data
- **Question:** "How do I query 'actions per hour' efficiently?"

---

## Key Resources

- Chrome Extension docs: https://developer.chrome.com/docs/extensions/
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- recharts (charts): https://recharts.org/
- Tauri docs: https://tauri.app/

---

## Questions to Ask M3 Now

1. **Extension localhost access:** Can extension call daemon on localhost:8765, or do I need a tunnel?
2. **CORS:** Will daemon need CORS headers for extension requests?
3. **Alert schema:** What fields does each alert type have (BLAST_RADIUS vs CANARY)?
4. **Latency metrics:** Do you log decision latency? If so, which column in audit_logs?

---

*This is YOUR role plan. Keep it updated as you progress.*
*Last updated: [DATE] · Version: 1.0*
