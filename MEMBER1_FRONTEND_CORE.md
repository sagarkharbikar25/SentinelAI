# MEMBER1_PLAN.md — Frontend Core (Layout, Auth UI, Dashboard, Agents, Users)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 1 — FRONTEND CORE                ║
║  Progress: 0%                            ║
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

**Every page you build must have:** loading skeleton, error state + retry, empty state, role-based conditional rendering, responsive layout (1024px desktop + 375px mobile).

---

## 3. Permission Matrix (relevant to your pages)

| Action | Super Admin | Admin | Developer | Analyst | Viewer |
|--------|:---:|:---:|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/delete agents | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update agents | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| View agents | ✅ | ✅ | ✅ | ✅ | ✅ |

Build a `usePermission` hook to gate UI actions based on this matrix.

---

## 4. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [ ] Contribute to literature survey (min. 10 papers, team-wide)
- [ ] Create UI wireframes for login, dashboard, agent pages
- [ ] Contribute to Use Case Diagram (your doc ownership, see §8)

### Phase 2 — System Design (Weeks 4–5)
- [ ] Bootstrap Next.js project
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Create shared TypeScript type definitions (coordinate with Member 3 on API contracts)
- [ ] Review/approve architecture and API design with team

### Phase 3 — Foundation Development (Weeks 6–11)
- [ ] `/login` page — form validation, JWT storage
- [ ] `/register` page
- [ ] Protected route middleware (redirect if not authenticated)
- [ ] `usePermission` hook for role-based conditional rendering
- [ ] App layout with sidebar navigation
- [ ] `/dashboard` page with stats cards (start with static mock data)
- [ ] `/agents` list page → wire to `GET /agents`
- [ ] `/agents/[id]` details page
- [ ] `/agents/new` creation form
- [ ] `/users` page (Super Admin only)

### Phase 4 — Integration (Weeks 12–14)
- [ ] Replace all mock data with real API calls
- [ ] Test auth flow end-to-end
- [ ] Test agent creation/listing end-to-end
- [ ] Fix integration bugs, participate in code review

**Semester 5 Exit Criteria (your part):** user can register/login, view dashboard with real data, create/view/edit/disable agents, configure tool assignments per agent.

---

## 5. Semester 6 — Security Engine Integration (Your Tasks)

### Month 4
- [ ] Polish dashboard with real data
- [ ] Fix Semester 5 bugs
- [ ] Add agent status badges

### Month 5
- [ ] Help Member 2 with Security Center UI
- [ ] Add agent activity section to dashboard

### Month 6
- [ ] Real-time alert badge in nav
- [ ] Dashboard alert feed

---

## 6. Semester 7 — Hardening (Your Tasks)

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write E2E tests using Playwright: login flow, agent creation, request submission

### Phase 16 — Final Docs
- [ ] Write **User Manual** (your doc ownership)
- [ ] Contribute to final presentation slides and demo rehearsal

---

## 7. Feature Ownership Summary

| Feature | Semester | MVP? |
|---------|----------|------|
| Login / Register UI | S5 | ✅ |
| App layout + nav | S5 | ✅ |
| Dashboard page | S5 | ✅ |
| Agents list + detail | S5 | ✅ |
| Users page | S5 | ✅ |
| Real-time alert badge | S6 | Should |
| E2E tests (Playwright) | S7 | Should |

---

## 8. Documentation You Own

| Document | Phase | Semester |
|----------|-------|----------|
| Use Case Diagram | Phase 2 | S5 |
| User Manual | Phase 16 | S7 |

---

## 9. Git Workflow

- Branches: `feature/frontend-auth`, `feature/frontend-dashboard`
- Never commit directly to `main` or `develop`
- One feature = one branch = one PR, min. 1 reviewer
- Commit convention: `feat(auth): implement login form with JWT storage`

---

## 10. Definition of Done (per feature)

- [ ] Code implemented and working
- [ ] Error handling covers failure cases
- [ ] Loading, error, and empty states present
- [ ] Manually tested by another team member
- [ ] PR reviewed and merged to `develop`
- [ ] PLAN.md / this file checkbox updated

---
*Derived from the master PLAN.md — keep in sync with the team's single source of truth.*
