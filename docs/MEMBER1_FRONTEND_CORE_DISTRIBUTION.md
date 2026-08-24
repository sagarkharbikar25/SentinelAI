# MEMBER1_FRONTEND_CORE_DISTRIBUTION.md — Frontend Core Plan Distribution
## Shared Plan Blueprint for Member 1 Across Semesters 5, 6, and 7

---

## 📘 Semester 5 — Foundation (Frontend Core & Shell Setup)

**Focus:** Application Shell, Authentication UI (`/login`, `/register`), AI Agent CRUD (`/agents`, `/agents/new`, `/agents/[id]`), User Management (`/users`), and Dashboard integration connected to NestJS Backend on Port 3001.

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Contribute to literature survey (min. 10 papers, team-wide)
- [x] Create UI wireframes for login, dashboard, agent pages
- [x] Contribute to Use Case Diagram

### Phase 2 — System Design (Weeks 4–5)
- [x] Bootstrap Next.js project structure
- [x] Set up Tailwind CSS and component library structure
- [x] Create shared TypeScript DTO type definitions aligned with NestJS API contracts
- [x] Review/approve architecture and API design with team

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] `/login` page — form validation, JWT token storage, error handling
- [x] `/register` page — user self-registration form
- [x] Auth state management & token interceptors
- [x] App layout with responsive navbar & sidebar navigation
- [x] `/dashboard` overview page with live stats cards & metric counts
- [x] `/agents` list page → wired to NestJS `GET /agents`
- [x] `/agents/new` creation form → wired to NestJS `POST /agents`
- [x] `/agents/[id]` details page → wired to NestJS `GET /agents/:id`
- [x] `/users` page → wired to NestJS `GET /users` (Super Admin management)

### Phase 4 — Integration (Weeks 12–14)
- [x] Connect Frontend UI to Member 3 NestJS Backend API (`http://localhost:3001`)
- [x] Test auth flow & JWT persistence end-to-end
- [x] Test agent creation/listing end-to-end with live Supabase database
- [x] Fix integration bugs and participate in cross-team review

**Docs owned:** Use Case Diagram, User Manual

**Exit criteria:** User can register/login, view dashboard with real data, create/view/edit agents, and inspect user management.

---

## 📗 Semester 6 — Security Engine Integration (Your Tasks)

### Month 4
- [ ] Polish dashboard with real risk metric feeds
- [ ] Add agent status badges and active risk indicators

### Month 5
- [ ] Coordinate with Member 2 on Security Center UI
- [ ] Add agent activity execution timeline section to dashboard

### Month 6
- [ ] Real-time alert badge in nav bar
- [ ] Dashboard security alert feed

**Exit criteria:** Dashboard live risk feed + real-time alert badge in header.

---

## 📙 Semester 7 — Hardening & Deployment (Your Tasks)

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write E2E tests using Playwright: login flow, agent creation, request submission

### Phase 16 — Final Documentation
- [ ] Write **User Manual** (your doc ownership)
- [ ] Contribute to final presentation slides and demo rehearsal
