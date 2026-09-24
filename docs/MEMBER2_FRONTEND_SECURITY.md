# MEMBER2_PLAN.md — Frontend Security (Security UI, Analytics, Policy UI, Audit, Alerts)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 2 — FRONTEND SECURITY            ║
║  Progress: 100% (Semester 5 Completed)   ║
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
| Audit Logs | `/audit-logs` | `GET /audit-logs` |
| Alerts | `/alerts` | `GET /alerts` |
| Analytics | `/analytics` | `GET /dashboard/threats`, `GET /dashboard/agent-activity` |

---

## 3. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Contribute to literature survey
- [x] Create UI wireframes & App Shell layout for Security Center, Analytics, Audit Logs, and Policy pages

### Phase 2 — System Design (Weeks 4–5)
- [x] Review architecture and API contracts (`docs/API_CONTRACT_SPECS.md`)
- [x] Coordinate component library structure (Navbar, Sidebar, Layout)

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] Define shared component library (Navbar, Sidebar, Badges, Buttons, Cards, Inputs, Tables)
- [x] `/tools` page → wired to NestJS `GET /tools`
- [x] `/policies` list page → wired to NestJS `GET /policies`
- [x] `/policies/new` page → wired to NestJS `POST /policies`
- [x] Create placeholder pages for Security Center (`/security`) and Audit Logs (`/audit-logs`)
- [x] Support dashboard landing view and navigation shell

### Phase 4 — Integration (Weeks 12–14)
- [x] Connect Frontend UI to Member 3 NestJS Backend API (`http://localhost:3001`)
- [x] Replace mock data with live NestJS + Supabase API calls
- [x] Fix integration bugs and conduct cross-team review

**Semester 5 Exit Criteria (your part):** basic policy creation works, audit events viewable, tools list displayed.
