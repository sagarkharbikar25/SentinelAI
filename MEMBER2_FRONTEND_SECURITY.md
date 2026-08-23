# MEMBER2_PLAN.md — Frontend Security (Security UI, Analytics, Policy UI, Audit, Alerts)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 2 — FRONTEND SECURITY            ║
║  Progress: 0%                            ║
╚══════════════════════════════════════════╝
```
**Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Completed · `[!]` Blocked

---

## 1. Your Role

You are **Frontend Developer #2**. You own everything security- and governance-facing in the UI: the Security Center, Request Tester, Policy management, Tools, Audit Logs, Alerts, and Analytics. Member 1 owns the core app shell (auth, dashboard, agents). You depend heavily on Member 3's security/decision APIs.

**Tech stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts/Chart.js for analytics

---

## 2. Pages You Own

| Page | Route | API Dependencies |
|------|-------|-------------------|
| Security Center | `/security` | `POST /security/decision`, `GET /security-events` |
| Request Tester | `/security/test` | `POST /security/evaluate`, `POST /security/decision` |
| Policies | `/policies` | `GET /policies`, `POST /policies` |
| Policy Editor | `/policies/[id]/edit` | `GET /policies/:id`, `PATCH /policies/:id` |
| Tools | `/tools` | `GET /tools` |
| Audit Logs | `/audit` | `GET /audit-logs` |
| Alerts | `/alerts` | `GET /alerts` |
| Analytics | `/analytics` | `GET /dashboard/threats`, `GET /dashboard/agent-activity` |

**Every page you build must have:** loading skeleton, error state + retry, empty state, role-based conditional rendering, responsive layout (1024px desktop + 375px mobile).

---

## 3. Permission Matrix (relevant to your pages)

| Action | Super Admin | Admin | Developer | Analyst | Viewer |
|--------|:---:|:---:|:---:|:---:|:---:|
| Create policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| View policies | ✅ | ✅ | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ✅ | ✅ (own) | ✅ | ❌ |
| View security alerts | ✅ | ✅ | ❌ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ❌ | ✅ | ✅ |
| Configure tools | ✅ | ✅ | ❌ | ❌ | ❌ |

Reuse Member 1's `usePermission` hook to gate actions.

---

## 4. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [ ] Contribute to literature survey
- [ ] Create UI wireframes for security center, analytics, audit logs, policy pages

### Phase 2 — System Design (Weeks 4–5)
- [ ] Review/approve architecture and API design
- [ ] Coordinate component library structure with Member 1

### Phase 3 — Foundation Development (Weeks 6–11)
- [ ] Define and document shared component library (Button, Input, Card, Table, Badge, Modal, Toast)
- [ ] `/tools` page → wire to `GET /tools`
- [ ] `/policies` list page → wire to `GET /policies`
- [ ] Create placeholder pages for Security Center and Analytics
- [ ] Help Member 1 with dashboard chart components

### Phase 4 — Integration (Weeks 12–14)
- [ ] Replace mock data with real API calls
- [ ] Fix integration bugs, participate in code review

**Semester 5 Exit Criteria (your part):** basic policy creation works, audit events viewable.

---

## 5. Semester 6 — Security Engine Integration (Your Tasks)

### Phase 8 — Decision Engine (Weeks 7–9)
- [ ] `/security` Security Center page
- [ ] `/security/test` Request Tester (submit prompt → see decision + explanation)
- [ ] Explainability display component (risk breakdown, reasons, violated policies)
- [ ] `/policies` management page with create/edit/delete

### Phase 9 — Full Integration (Weeks 9–11)
- [ ] `/audit` page with search and filter, wired to real audit log data
- [ ] `/alerts` page, wired to real alerts

**Semester 6 Exit Criteria (your part):** Security Center + Request Tester functional end-to-end, showing real ALLOW/WARN/BLOCK decisions with explanations.

---

## 6. Semester 7 — Hardening (Your Tasks)

### Phase 11 — Advanced Monitoring (Weeks 1–3)
- [ ] `/analytics` page with threat trend charts (Chart.js or Recharts)
- [ ] Agent activity table (block rate, avg risk)
- [ ] Risk distribution pie/bar chart
- [ ] Alert severity distribution chart

### Phase 12 — Explainability Enhancement (Weeks 2–4)
- [ ] Design and implement explainability report UI component
- [ ] Show full decision trace on request detail page

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write E2E tests: security center flow, audit log search, alert display

---

## 7. Feature Ownership Summary

| Feature | Semester | MVP? |
|---------|----------|------|
| Shared component library | S5 | ✅ |
| Tools + Policies list pages | S5 | ✅ |
| Security Center UI | S6 | ✅ |
| Policy management UI | S6 | ✅ |
| Audit logs UI | S6 | ✅ |
| Request tester UI | S6 | ✅ |
| Security analytics | S7 | Should |
| E2E tests (security flow) | S7 | Should |

---

## 8. Git Workflow

- Branches: `feature/frontend-security`, `feature/frontend-analytics`
- Never commit directly to `main` or `develop`
- One feature = one branch = one PR, min. 1 reviewer
- Commit convention: `feat(security): add request tester UI with live decision API`

---

## 9. Definition of Done (per feature)

- [ ] Code implemented and working
- [ ] Error handling covers failure cases
- [ ] Loading, error, and empty states present
- [ ] Manually tested by another team member
- [ ] PR reviewed and merged to `develop`
- [ ] PLAN.md / this file checkbox updated

---
*Derived from the master PLAN.md — keep in sync with the team's single source of truth.*
