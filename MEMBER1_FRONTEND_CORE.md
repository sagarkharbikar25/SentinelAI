# MEMBER1_PLAN.md — Frontend Core (Layout, Auth UI, Dashboard, Agents, Users)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 1 — FRONTEND CORE                ║
║  Progress: 100% (Semester 5 Completed)   ║
╚══════════════════════════════════════════╝
```
**Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Completed · `[!]` Blocked

---

## 1. Your Role

You are **Frontend Developer #1**. You own the **core application shell** — authentication UI, app layout/navigation, dashboard, agent management pages, and user management. Member 2 owns security-specific UI (policies, audit, analytics). You depend on Member 3's backend APIs and Member 4's seed data.

**Tech stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Zustand (state)

---

## 2. Pages You Own

| Page | Route | API Dependencies |
|------|-------|-------------------|
| Login | `/login` | `POST /auth/login` |
| Register | `/register` | `POST /auth/register` |
| Dashboard | `/dashboard` | `GET /dashboard/summary`, `GET /dashboard/risk-trends` |
| Agents List | `/agents` | `GET /agents` |
| Agent Details | `/agents/[id]` | `GET /agents/:id`, `GET /agents/:id/requests` |
| Create Agent | `/agents/new` | `POST /agents`, `GET /tools` |
| Users | `/users` | `GET /users`, `PATCH /users/:id` |
| Settings | `/settings` | `GET /auth/me`, `PATCH /users/:id` |

---

## 3. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Contribute to literature survey (min. 10 papers, team-wide)
- [x] Create UI wireframes for login, dashboard, agent pages
- [x] Contribute to Use Case Diagram

### Phase 2 — System Design (Weeks 4–5)
- [x] Bootstrap Next.js project
- [x] Set up Tailwind CSS and component library
- [x] Create shared TypeScript type definitions
- [x] Review/approve architecture and API design with team

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] `/login` page — form validation, JWT storage
- [x] `/register` page
- [x] Protected route middleware & token interceptors
- [x] `usePermission` hook & role-based rendering
- [x] App layout with sidebar navigation
- [x] `/dashboard` page with stats cards
- [x] `/agents` list page → wired to `GET /agents`
- [x] `/agents/[id]` details page
- [x] `/agents/new` creation form
- [x] `/users` page (Super Admin management)

### Phase 4 — Integration (Weeks 12–14)
- [x] Replace all mock data with real NestJS + Supabase API calls
- [x] Test auth flow end-to-end
- [x] Test agent creation/listing end-to-end
- [x] Fix integration bugs, participate in code review

**Semester 5 Exit Criteria (your part):** user can register/login, view dashboard with real data, create/view/edit/disable agents, configure tool assignments per agent.
