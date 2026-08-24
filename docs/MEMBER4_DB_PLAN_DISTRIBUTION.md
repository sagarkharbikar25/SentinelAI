# MEMBER4_DB_PLAN_DISTRIBUTION.md — Database, DevOps & Research Plan Distribution
## Shared Plan Blueprint for Member 4 Across Semesters 5, 6, and 7

---

## 📘 Semester 5 — Foundation (Database Setup)

**Focus:** Get the schema, migrations, and dev environment ready to support core features (auth, agent CRUD, tool config, basic policies, audit logging).

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Draft ER diagram & data dictionary
- [x] Define all database tables, columns, constraints, and relationships
- [x] Contribute to literature survey

### Phase 2 — System Design (Weeks 4–5)
- [x] Set up GitHub repo and branch structure
- [x] Create `docker-compose.yml` with PostgreSQL 16
- [x] Initialize schema migrations (`20260823000000_initial_schema.sql`)
- [x] Finalize database schema

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] Write all SQL migrations (`users`, `roles`, `permissions`, `agents`, `tools`, `policies`, `requests`, `audit_logs`, `sessions`)
- [x] Create seed data: 5 system roles (`SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `ANALYST`, `VIEWER`), 3 test users, 4 sample agents, 5 tools, default security policy & rules
- [x] Implement backup strategy (`database/backup/backup.sh`)
- [x] Create SQL performance indexes (`idx_requests_agent_id`, `idx_audit_logs_user_id`, etc.)

### Phase 4 — Integration (Weeks 12–14)
- [x] Support integration & Supabase/PostgreSQL live cloud deployment
- [x] Align DB schema with Member 3 NestJS backend API

**Docs owned:** ER Diagram, Database Documentation, SRS (co-owned)

**Exit criteria:** Schema + migrations + seed data fully support register/login, agent CRUD, tool config, basic policies, audit events.

---

## 📗 Semester 6 — Research Datasets & Experiments

**Focus:** Build the labeled datasets and start measuring real detection/policy metrics — no fabricated numbers, ever.

### Phase 5 — Prompt Security Service (Weeks 1–3)
- [ ] Create dataset: 100 safe + 100 injection prompts
- [ ] Label all with expected classification (SAFE/SUSPICIOUS/MALICIOUS)
- [ ] Document dataset source and labeling methodology

### Phase 6 — Policy Engine (Weeks 3–5)
- [ ] Add more `policy_rules` seed data covering all agent types
- [ ] Add policy violation test cases to dataset

### Phase 7 — Risk Engine (Weeks 5–7)
- [ ] Extend dataset with risk-scored examples
- [ ] Create risk calibration spreadsheet (expected vs actual)

### Phase 8 — Decision Engine (Weeks 7–9)
- [ ] Support Member 3's alert auto-generation — ensure schema supports it

### Phase 10 — Research Experiments (Weeks 11–14) — **you lead**
- [ ] Finalize dataset: 200 safe + 200 injection + 100 policy violation + 100 tool abuse
- [ ] Run detection accuracy experiment (Precision/Recall/F1)
- [ ] Run latency experiment (avg decision latency under load)
- [ ] Run before/after comparison (baseline vs SentinelAI-protected agent)
- [ ] Log all results in `RESEARCH_LOGBOOK.md`, using `[TO BE MEASURED]` until real numbers exist
- [ ] Analyze false positives/negatives

**Docs owned:** Research Logbook (ongoing), Research Methodology

**Exit criteria:** Finalized labeled datasets + honest, measured metrics.

---

## 📙 Semester 7 — Hardening & Deployment

**Focus:** Monitoring, testing, finalizing research results, and shipping.

### Phase 11 — Advanced Monitoring (Weeks 1–3)
- [ ] Set up Prometheus + Grafana via Docker
- [ ] Add `/metrics` endpoint to NestJS (coordinate with Member 3)
- [ ] Build Grafana dashboard (request counts, block rate, latency)

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write DB constraint tests (`audit_log` immutability)
- [ ] Write seed data validation tests

### Phase 14 — Research Evaluation (Weeks 5–8) — **you lead**
- [ ] Finalize all `[TO BE MEASURED]` results
- [ ] Write Research Methodology section
- [ ] Write Results and Discussion section
- [ ] Compare protected vs unprotected agent on 5 attack scenarios
- [ ] Prepare research paper in IEEE format (with team)

### Phase 15 — Deployment (Weeks 6–9)
- [ ] Create `docker-compose.prod.yml`
- [ ] Set up GitHub Actions CI (lint + test on PR)
- [ ] Set up CD pipeline (build + push Docker images)
- [ ] Prepare deployment guide
- [ ] Select hosting (Render + Vercel + Neon, or self-hosted VM)
- [ ] Document env variables in `.env.example`

**Docs owned:** Experimental Results, Deployment Guide
