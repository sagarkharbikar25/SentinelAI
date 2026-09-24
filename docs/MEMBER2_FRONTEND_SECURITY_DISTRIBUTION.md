# MEMBER2_FRONTEND_SECURITY_DISTRIBUTION.md — Frontend Security Plan Distribution
## Shared Plan Blueprint for Member 2 Across Semesters 5, 6, and 7

---

## 📘 Semester 5 — Foundation (Frontend Security Setup)

**Focus:** Build shared component library placeholders, integrate with NestJS backend APIs (`/tools`, `/policies`), and establish UI structure.

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Contribute to literature survey
- [x] Create UI wireframes for Security Center, Analytics, Audit Logs, and Policy pages

### Phase 2 — System Design (Weeks 4–5)
- [x] Review architecture and API contracts (`docs/API_CONTRACT_SPECS.md`)
- [x] Coordinate component library structure with Member 1

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] Define shared component library (Navbar, Sidebar, Badges, Buttons, Cards, Inputs, Tables)
- [x] `/tools` page → wire to NestJS `GET /tools`
- [x] `/policies` list page → wire to NestJS `GET /policies`
- [x] `/policies/new` interactive policy builder → wire to NestJS `POST /policies`
- [x] Create placeholder pages for Security Center (`/security`) and Audit Logs (`/audit-logs`)
- [x] Support Member 1 with dashboard landing page

### Phase 4 — Integration (Weeks 12–14)
- [x] Connect Frontend UI to Member 3 NestJS Backend API (`http://localhost:3001`)
- [x] Replace mock data with live NestJS + Supabase API calls
- [x] Fix integration bugs and conduct cross-team review

**Docs owned:** Security UI Specs, Policy Component Specs

**Exit criteria:** Basic policy creation works, audit events viewable, tools list displayed.

---

## 📗 Semester 6 — Security Engine Integration

**Focus:** Security Center UI, live prompt decision tester, audit log search/filtering, and real-time security alerts.

### Phase 8 — Decision Engine (Weeks 7–9)
- [ ] `/security` Security Center page
- [ ] `/security/test` Request Tester (submit prompt → see decision + explanation)
- [ ] Explainability display component (risk breakdown, reasons, violated policies)
- [ ] `/policies` management page with create/edit/delete

### Phase 9 — Full Integration (Weeks 9–11)
- [ ] `/audit` page with search and filter, wired to real audit log data
- [ ] `/alerts` page, wired to real alerts

**Exit criteria:** Security Center + Request Tester functional end-to-end, showing real ALLOW/WARN/BLOCK decisions with explanations.

---

## 📙 Semester 7 — Hardening & Monitoring

**Focus:** Advanced analytics charts, explainability report exporter, E2E testing, and production UI polish.

### Phase 11 — Advanced Monitoring (Weeks 1–3)
- [ ] `/analytics` page with threat trend charts (Recharts / Chart.js)
- [ ] Agent activity table (block rate, avg risk score)
- [ ] Risk distribution pie/bar chart
- [ ] Alert severity distribution chart

### Phase 12 — Explainability Enhancement (Weeks 2–4)
- [ ] Design and implement explainability report UI component
- [ ] Show full decision trace on request detail page

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write E2E tests: security center flow, audit log search, alert display

**Exit criteria:** Fully hard threat analytics dashboard + E2E tested security flows.
