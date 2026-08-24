# MEMBER4_PLAN.md — Database + DevOps + Research (PostgreSQL, Docker, CI/CD, Datasets)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 4 — DATABASE + DEVOPS + RESEARCH ║
║  Progress: 0%                            ║
╚══════════════════════════════════════════╝
```
**Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Completed · `[!]` Blocked

---

## 1. Your Role

You own the **PostgreSQL schema, Prisma migrations, Docker/DevOps setup, CI/CD, and the research datasets/experiments** that back the whole project's empirical claims. You lead the research measurement effort in Semester 6–7 alongside Member 3.

**Tech stack:** PostgreSQL 16+ · Prisma 5+ · Docker + Docker Compose · Redis 7+ (optional) · GitHub Actions · Prometheus + Grafana

---

## 2. Database Schema You Own

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Registered platform users |
| `roles` | System roles (Super Admin, Admin, etc.) |
| `permissions` | Individual permission keys |
| `role_permissions` | Role ↔ Permission mapping |
| `agents` | Registered AI agents |
| `tools` | Available tools registry |
| `agent_tools` | Agent ↔ Tool mapping (with overrides) |
| `policies` | Governance policy definitions |
| `policy_rules` | Individual rules within a policy |
| `requests` | Every agent action request |
| `risk_assessments` | Risk score records per request |
| `security_events` | Threat detections and anomalies |
| `audit_logs` | Complete immutable activity log |
| `alerts` | Generated security alerts |
| `sessions` | Active user sessions |

### Key Prisma model notes (coordinate with Member 3 on exact schema)
- `Agent.type`: enum `RESEARCH | EMAIL | DATABASE | CODING`
- `Agent.status`: enum `ACTIVE | INACTIVE | SUSPENDED`
- `Agent.riskLevel` / `Tool.riskLevel`: enum `LOW | MEDIUM | HIGH`
- `Request.decision`: enum `ALLOW | WARN | BLOCK`
- `Request.promptHash`: SHA-256 of prompt — **never store raw prompt text**
- `AuditLog`: append-only, **no `updatedAt` field**, no UPDATE/DELETE ever

### Indexes to create
```sql
CREATE INDEX idx_requests_agent_id ON requests(agent_id);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Data Retention Rules
- `audit_logs` — never delete, append-only, archive after 1 year
- `requests` — retain 90 days, then archive
- `security_events` — retain 1 year
- `sessions` — delete expired via nightly cron
- Never store: raw prompt text, plaintext passwords, plaintext API keys

---

## 3. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [x] Draft ER diagram & data dictionary
- [x] Define all database tables, columns, constraints, and relationships
- [x] Contribute to literature survey

### Phase 2 — System Design (Weeks 4–5)
- [x] Set up GitHub repository and branch structure
- [x] Create `docker-compose.yml` with PostgreSQL 16
- [x] Initialize schema migrations (`20260823000000_initial_schema.sql`)
- [x] Finalize database schema

### Phase 3 — Foundation Development (Weeks 6–11)
- [x] Write SQL schema migrations (`users`, `roles`, `permissions`, `agents`, `tools`, `policies`, `requests`, `audit_logs`, `sessions`)
- [x] Create seed data: 5 system roles (`SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `ANALYST`, `VIEWER`), 3 test users, 4 sample agents, 5 tools, default security policies & rules
- [x] Implement database backup strategy (`database/backup/backup.sh`)
- [x] Create SQL performance indexes (`idx_requests_agent_id`, `idx_audit_logs_user_id`, etc.)

### Phase 4 — Integration (Weeks 12–14)
- [x] Support integration & Supabase/PostgreSQL live cloud deployment
- [x] Align DB schema with Member 3 NestJS backend API

**Semester 5 Exit Criteria (your part):** schema + migrations + seed data fully support register/login, agent CRUD, tool config, basic policies, audit events.

---

## 4. Semester 6 — Research Datasets & Experiments (Your Tasks)

### Phase 5 — Prompt Security Service (Weeks 1–3)
- [ ] Create research dataset: 100 safe prompts + 100 injection prompts
- [ ] Label all prompts with expected classification (SAFE/SUSPICIOUS/MALICIOUS)
- [ ] Document dataset source and labeling methodology

### Phase 6 — Policy Engine (Weeks 3–5)
- [ ] Add more `policy_rules` seed data covering all agent types
- [ ] Add policy violation test cases to research dataset

### Phase 7 — Risk Engine (Weeks 5–7)
- [ ] Extend research dataset with risk-scored examples
- [ ] Create risk calibration spreadsheet (expected vs actual scores)

### Phase 8 — Decision Engine (Weeks 7–9)
- [ ] (Support Member 3's alert auto-generation from the data side — ensure schema supports it)

### Phase 10 — Research Experiments (Weeks 11–14) — **you lead**
- [ ] Finalize dataset: 200 safe + 200 injection + 100 policy violation + 100 tool abuse
- [ ] Run detection accuracy experiment: Precision, Recall, F1 on prompt injection
- [ ] Run latency experiment: average decision latency under load
- [ ] Run before/after comparison: baseline agent vs SentinelAI-protected agent
- [ ] Record all results in `RESEARCH_LOGBOOK.md` — use `[TO BE MEASURED]` placeholders until real numbers exist
- [ ] Analyze false positives and false negatives

**Semester 6 Exit Criteria (your part):** finalized labeled datasets and honest, measured research metrics — never fabricated.

---

## 5. Semester 7 — Hardening & Deployment (Your Tasks)

### Phase 11 — Advanced Monitoring (Weeks 1–3)
- [ ] Set up Prometheus + Grafana via Docker
- [ ] Add metrics endpoint to NestJS (`/metrics`) — coordinate with Member 3
- [ ] Create Grafana dashboard for request counts, block rate, latency

### Phase 13 — Testing (Weeks 3–6)
- [ ] Write database constraint tests (audit_log cannot be updated)
- [ ] Write seed data validation tests

### Phase 14 — Research Evaluation (Weeks 5–8) — **you lead**
- [ ] Finalize all experiment results (fill in `[TO BE MEASURED]` placeholders)
- [ ] Write Research Methodology section
- [ ] Write Results and Discussion section
- [ ] Compare SentinelAI protected vs unprotected agent on 5 attack scenarios
- [ ] Prepare research paper in IEEE format (with team)

### Phase 15 — Deployment (Weeks 6–9)
- [ ] Create production `docker-compose.prod.yml`
- [ ] Set up GitHub Actions CI pipeline (lint + test on PR)
- [ ] Set up CD pipeline (build + push Docker images)
- [ ] Prepare deployment guide document
- [ ] Select hosting (Render + Vercel + Neon or self-hosted VM)
- [ ] Document all environment variables in `.env.example`

---

## 6. Research Plan You Lead

### Research Questions
- **RQ1:** Detection accuracy — F1 ≥ 0.85 hypothesis, dataset 200 safe + 200 injection
- **RQ2:** Policy enforcement block rate — 100% hypothesis on 100 policy violation requests
- **RQ3:** Latency overhead — ≤500ms p95 hypothesis (k6 load test)
- **RQ4:** False positive rate — ≤10% hypothesis on 200 safe prompts

### Experiment Design
1. **Detection Accuracy** — submit 400 labeled prompts through `POST /security/analyze`, compute TP/FP/TN/FN/Precision/Recall/F1/Accuracy
2. **Before vs After** — 20 attack requests on unprotected agent vs same 20 on SentinelAI-protected agent
3. **Latency Overhead** — baseline vs full pipeline latency, compute the difference

> ⚠️ **Never invent research numbers.** Use `[TO BE MEASURED]` until the real number is calculated.

### Dataset Structure
```json
{
  "id": "safe_001",
  "prompt": "Search for latest research papers on machine learning",
  "expectedClassification": "SAFE",
  "category": "information_retrieval",
  "agentType": "RESEARCH"
}
```

---

## 7. Performance & Database Tests You Own

- **Performance (k6 or Apache Bench):** 50 concurrent users submitting security decisions; target p95 latency for `POST /security/decision` ≤ 500ms
- **Database:** audit_log cannot be updated/deleted (trigger test); cascade delete works correctly for agents; unique constraints on email, policy name, tool name

---

## 8. Feature Ownership Summary

| Feature | Semester | MVP? |
|---------|----------|------|
| Project setup + repo | S5 | ✅ |
| Docker Compose | S5 | ✅ |
| PostgreSQL schema | S5 | ✅ |
| Prisma migrations | S5 | ✅ |
| Research datasets | S6 | ✅ |
| Research experiments | S6 | ✅ |
| Prometheus + Grafana | S7 | Should |
| GitHub Actions CI/CD | S7 | Should |

---

## 9. Documentation You Own

| Document | Phase | Semester |
|----------|-------|----------|
| ER Diagram | Phase 2 | S5 |
| Database Documentation | Phase 3 | S5 |
| SRS (co-owned with Member 3) | Phase 2 | S5 |
| Research Logbook | Ongoing | S5→S7 |
| Research Methodology | Phase 10 | S6 |
| Experimental Results | Phase 14 | S7 |
| Deployment Guide | Phase 15 | S7 |

---

## 10. Git Workflow

- Branches: `feature/database-schema`, `feature/database-seeds`, `feature/devops-docker`
- Never commit directly to `main` or `develop`
- One feature = one branch = one PR, min. 1 reviewer
- Commit convention: `chore(docker): update compose file for production`

---

## 11. Key Risks Owned By You

| Risk | Mitigation |
|------|-----------|
| Free hosting limits (Render, Vercel) | Have Docker self-hosted fallback; test on localhost for demo |
| Database performance under load | Add indexes; use connection pooling; cache dashboard queries |
| Research results don't support hypothesis | Report honest results; discuss limitations — this is valid research |

---
*Derived from the master PLAN.md — keep in sync with the team's single source of truth.*
