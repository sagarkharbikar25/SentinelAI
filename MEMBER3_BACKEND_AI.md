# MEMBER3_PLAN.md — Backend + AI/Security (NestJS, Auth, RBAC, Prompt Security, Risk & Decision Engines)
## Derived from PLAN.md — SentinelAI Master Project Plan

---

```
╔══════════════════════════════════════════╗
║  MEMBER 3 — BACKEND + AI/SECURITY        ║
║  Progress: 0%                            ║
╚══════════════════════════════════════════╝
```
**Legend:** `[ ]` Not started · `[~]` In progress · `[x]` Completed · `[!]` Blocked

---

## 1. Your Role

You are the **Backend + AI/Security engineer**. You own the NestJS API layer (auth, RBAC, agents, tools, policies, security orchestration, audit) and the FastAPI AI/security microservice (prompt injection detection, risk scoring, decision engine, explainability). This is the largest and most technically central role — both frontend members depend on your endpoints.

**Tech stack:** NestJS + TypeScript · Prisma ORM · FastAPI + Python 3.11+ · LangGraph/LangChain (optional) · Ollama + Qwen/Llama (optional local LLM)

---

## 2. Services You Own

```
BACKEND API (Port 3001) — NestJS + Prisma
  Auth · RBAC · Agents · Tools · Policy · Security · Audit · Dashboard · Alerts modules

AI/SECURITY SERVICE (Port 8000) — FastAPI + Python
  Prompt Security · Risk Scoring · Decision Engine · Policy Evaluator · Explainability
```

Communication flow: `Next.js → NestJS /security/analyze|evaluate|decision → FastAPI (internal) → decision + explanation → NestJS logs to PostgreSQL → returns to frontend`.

---

## 3. Full API Surface You Build

### Authentication
```
POST /auth/register   Body: {name, email, password}         Roles: Public
POST /auth/login      Body: {email, password}                Roles: Public
POST /auth/logout                                             Roles: All authenticated
GET  /auth/me                                                 Roles: All authenticated
```

### Users
```
GET   /users              Roles: SUPER_ADMIN
GET   /users/:id          Roles: SUPER_ADMIN, ADMIN, self
PATCH /users/:id          Roles: SUPER_ADMIN
PATCH /users/:id/role     Roles: SUPER_ADMIN
```

### Agents
```
POST   /agents             Roles: ADMIN, SUPER_ADMIN
GET    /agents             Roles: All authenticated
GET    /agents/:id         Roles: All authenticated
PATCH  /agents/:id         Roles: ADMIN, SUPER_ADMIN, DEVELOPER (own)
DELETE /agents/:id         Roles: ADMIN, SUPER_ADMIN
POST   /agents/:id/tools   Roles: ADMIN, SUPER_ADMIN
GET    /agents/:id/requests Roles: ADMIN, DEVELOPER (own), ANALYST
```

### Tools
```
POST  /tools     Roles: SUPER_ADMIN
GET   /tools     Roles: All authenticated
PATCH /tools/:id Roles: SUPER_ADMIN
```

### Policies
```
POST   /policies      Roles: ADMIN, SUPER_ADMIN
GET    /policies      Roles: All authenticated
GET    /policies/:id  Roles: All authenticated
PATCH  /policies/:id  Roles: ADMIN, SUPER_ADMIN
DELETE /policies/:id  Roles: SUPER_ADMIN
```

### Security — Core APIs
```
POST /security/analyze   Prompt-only threat analysis     Roles: ADMIN, DEVELOPER
POST /security/evaluate  Full evaluation, no logging      Roles: ADMIN, DEVELOPER
POST /security/decision  Full pipeline + log + audit       Roles: ADMIN, DEVELOPER
```

### Audit & Security Events
```
GET   /audit-logs                Roles: SUPER_ADMIN, ADMIN, ANALYST
GET   /audit-logs/:id            Roles: SUPER_ADMIN, ADMIN, ANALYST
GET   /security-events           Roles: SUPER_ADMIN, ADMIN, ANALYST
PATCH /security-events/:id/resolve  Roles: ADMIN, ANALYST
```

### Alerts
```
GET   /alerts             Roles: SUPER_ADMIN, ADMIN, ANALYST
PATCH /alerts/:id/read    Roles: SUPER_ADMIN, ADMIN, ANALYST
PATCH /alerts/read-all    Roles: SUPER_ADMIN, ADMIN, ANALYST
```

### Dashboard
```
GET /dashboard/summary        Roles: All (Viewer sees limited data)
GET /dashboard/risk-trends    Roles: All except Viewer
GET /dashboard/threats        Roles: ADMIN, ANALYST, SUPER_ADMIN
GET /dashboard/agent-activity Roles: ADMIN, ANALYST, SUPER_ADMIN
```

**Standard response formats:** success `{success, data, meta}`; error `{success:false, error:{code, message, statusCode}}`. Status codes: 200/201/400/401/403/404/409/422/429/500.

---

## 4. Core Modules You Implement

1. **Authentication** — JWT (1h expiry), bcrypt (12 rounds), HTTP-only cookie or Authorization header, optional refresh token.
2. **RBAC** — NestJS Guards + `@Roles()` / `@Permissions()` decorators, checked at guard level before controller.
3. **Prompt Security (FastAPI)** — normalize → rule-based detection (0-40 pts) → structural analysis (0-30 pts) → optional LLM-assisted classification only when confidence is 0.3–0.7 (0-30 pts) → Threat Level (SAFE/SUSPICIOUS/MALICIOUS) + confidence. **LLM is a helper, never the primary classifier.**
4. **Policy Engine** — `evaluatePolicy(agentType, toolName, operation)`: match rules, DENY effect returns violation.
5. **Risk Scoring** — `riskScore = promptThreat×0.35 + toolSensitivity×0.25 + policyViolation×0.25 + agentPrivilege×0.15`, capped at 100. Thresholds: 0-30 ALLOW, 31-70 WARN, 71-100 BLOCK. **These weights must be calibrated in S6 Phase 10 research.**
6. **Decision Engine** — tool permission denied → BLOCK; policy DENY → BLOCK; policy REQUIRE_CONFIRMATION → WARN; risk ≥71 → BLOCK; risk ≥31 → WARN; else ALLOW.
7. **Explainability** — every decision returns summary, reasons[], violatedPolicies[], promptThreats[], riskBreakdown.
8. **Audit Logging** — log userId, IP, agentId/type, toolName, operation, **prompt hash (SHA-256, never raw prompt)**, risk score, decision, violated policies, timestamp. Append-only, no UPDATE/DELETE.

---

## 5. Semester 5 — Foundation (Your Tasks)

### Phase 1 — Research & Requirements (Weeks 1–3)
- [ ] Draft API specification for all endpoints
- [ ] Define NestJS module structure
- [ ] Contribute to literature survey

### Phase 2 — System Design (Weeks 4–5)
- [ ] Bootstrap NestJS project, set up folder structure, configure env vars
- [ ] Finalize API design with team; contribute to Architecture Diagram, Sequence Diagrams

### Phase 3 — Foundation Development (Weeks 6–11)
- [ ] `POST /auth/register` with bcrypt password hashing
- [ ] `POST /auth/login` with JWT generation
- [ ] `POST /auth/logout`, `GET /auth/me`
- [ ] JWT Guard + RBAC guard
- [ ] User CRUD APIs
- [ ] Agent CRUD APIs (`POST/GET/PATCH/DELETE /agents`)
- [ ] Tool CRUD APIs
- [ ] Policy CRUD APIs
- [ ] Swagger documentation
- [ ] Unit tests for auth and agent services

### Phase 4 — Integration (Weeks 12–14)
- [ ] Support frontend integration, fix bugs, code review

**Semester 5 Exit Criteria (your part):** all core CRUD + auth APIs working and documented in Swagger.

---

## 6. Semester 6 — AI Security Engine (Your Tasks)

### Phase 5 — Prompt Security Service (Weeks 1–3)
- [ ] Bootstrap FastAPI Python service
- [ ] Prompt normalization (lowercase, strip, tokenize)
- [ ] Rule-based injection detector (regex + keyword patterns)
- [ ] Structural analysis (role confusion, multi-instruction detection)
- [ ] Optional LLM-assisted classification (Ollama + Qwen)
- [ ] `POST /internal/analyze-prompt` endpoint
- [ ] Unit tests: 50 safe + 50 injection prompts

### Phase 6 — Policy Engine (Weeks 3–5)
- [ ] Policy rule loading from database
- [ ] Policy matching algorithm + `evaluatePolicy()`
- [ ] Connect policy engine to NestJS backend
- [ ] Seed default policies (with Member 4)

### Phase 7 — Risk Engine (Weeks 5–7)
- [ ] Risk factor extraction
- [ ] Weighted risk score calculation
- [ ] Risk category assignment (LOW/MEDIUM/HIGH)
- [ ] `POST /internal/score-risk` endpoint

### Phase 8 — Decision Engine (Weeks 7–9)
- [ ] Decision logic (ALLOW/WARN/BLOCK)
- [ ] Explainability output generator
- [ ] `POST /security/decision` full pipeline in NestJS
- [ ] Integrate: NestJS → FastAPI → Decision → Log → Return
- [ ] Automatic alert generation for HIGH risk / BLOCK

### Phase 9 — Full Integration (Weeks 9–11)
- [ ] End-to-end test: login → select agent → submit request → ALLOW/WARN/BLOCK
- [ ] Real-time alert display support

### Phase 10 — Research Experiments (Weeks 11–14, supporting Member 4)
- [ ] Run detection accuracy experiment (Precision/Recall/F1)
- [ ] Run latency experiment
- [ ] Run before/after comparison (baseline vs SentinelAI-protected)

**Semester 6 Exit Criteria (your part):** full pipeline detects injection, enforces policy, scores risk, generates audit log — with measured (not fabricated) metrics.

---

## 7. Semester 7 — Hardening (Your Tasks)

### Phase 12 — Explainability Enhancement
- [ ] Step-by-step reasoning, natural-language summary generation
- [ ] Printable decision report endpoint support

### Phase 13 — Testing (Weeks 3–6)
- [ ] Unit tests: AuthService, AgentService, PolicyService, RiskScorer, DecisionEngine — **target 70%+ coverage**
- [ ] Integration tests: `POST /security/decision` full pipeline

### Phase 14 — Research Evaluation
- [ ] Latency optimization, endpoint hardening
- [ ] Support finalizing experiment results

---

## 8. Testing You Own

- **Unit:** Jest (NestJS) + pytest (FastAPI), 70%+ coverage target
- **Integration:** Jest + Supertest — register → login → create agent → submit request → check audit log
- **API tests:** Postman collection committed to `/tests/`
- **Security tests:** 20 known injection prompts classified correctly; 10 policy violation requests all blocked; auth edge cases (expired/invalid/missing token); RBAC 403 checks

---

## 9. Feature Ownership Summary

| Feature | Semester | MVP? |
|---------|----------|------|
| NestJS bootstrap, Auth, RBAC, Agent/Tool/Policy CRUD | S5 | ✅ |
| FastAPI service, prompt injection detection | S6 | ✅ |
| Risk scoring engine | S6 | ✅ |
| Policy evaluation engine | S6 | ✅ |
| Decision engine | S6 | ✅ |
| Explainability | S6 | ✅ |
| Alerts system | S7 | Should |
| Unit + integration tests (70%+) | S7 | ✅ |

---

## 10. Documentation You Own

| Document | Phase | Semester |
|----------|-------|----------|
| Problem Statement | Phase 1 | S5 |
| SRS (co-owned with Member 4) | Phase 2 | S5 |
| Architecture Diagram | Phase 2 | S5 |
| Sequence Diagrams | Phase 2 | S5 |
| API Documentation (Swagger) | Phase 3 | S5→S6 |
| Test Plan / Test Report | Phase 13 | S7 |

---

## 11. Git Workflow

- Branches: `feature/backend-auth`, `feature/backend-agents`, `feature/backend-security`, `feature/ai-service-prompt`, `feature/ai-service-risk`
- Never commit directly to `main` or `develop`
- One feature = one branch = one PR, min. 1 reviewer
- Commit convention: `feat(auth): implement JWT login with bcrypt`

---

## 12. Key Risks Owned By You

| Risk | Mitigation |
|------|-----------|
| AI detection accuracy below target | Hybrid rules + ML; calibrate thresholds with dataset |
| Integration bugs NestJS ↔ FastAPI | Define internal API contract early; mock FastAPI during frontend dev |
| LLM hallucination in security decisions | Never use LLM as sole decision maker; always combine with rules |

---
*Derived from the master PLAN.md — keep in sync with the team's single source of truth.*
