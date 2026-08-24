# MEMBER3_SEM5_PLAN.md — Member 3 Semester 5 Week-by-Week Pure Backend Plan
## SentinelAI Backend Logic & API Layer (Excludes Database Administration)

---

```
╔══════════════════════════════════════════════════════════════════════╗
║  MEMBER 3 — BACKEND + AI/SECURITY (PURE BACKEND FOCUS)               ║
║  Primary Objective: NestJS Controllers, Services, Auth & Guards       ║
║  Database Note: Schema, Migrations & Seeds are managed by Member 4   ║
║  Status: Ready for Implementation                                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. Role Clarification & Responsibility Boundaries

As **Member 3 (Backend Engineer)**, your focus is strictly on **Application Logic, API Design, Authentication, Security Guards, and Swagger Documentation**.

| Domain | Owner | Scope |
|---|---|---|
| **Backend Application Logic** | **Member 3 (You)** | NestJS Controllers, Services, DTOs, Validation, Auth (JWT/Bcrypt), RBAC Guards, Swagger Docs, Unit Tests |
| **Database & Infrastructure** | **Member 4** | PostgreSQL Installation, Prisma Schema, Database Migrations, Seed Data, Docker Setup |

> ℹ️ *You will inject Member 4's `PrismaService` to query database records, but you do NOT manage SQL schema design, migrations, or database infrastructure.*

---

## 2. Technology Lock (Backend Logic)

| Layer | Specification |
|---|---|
| **Framework** | NestJS 10+ (TypeScript, modular architecture) |
| **Server Port** | `http://localhost:3001` |
| **Authentication** | JWT (1-hour expiry) + `bcrypt` (12 rounds password hashing) |
| **Authorization** | RBAC Guards (`JwtAuthGuard`, `RolesGuard`) & `@Roles()` metadata decorators |
| **Validation** | `class-validator` + `class-transformer` DTO pipe validation |
| **API Documentation** | `@nestjs/swagger` OpenAPI UI at `http://localhost:3001/api/docs` |
| **Testing** | Jest unit tests (`.spec.ts`) |

---

## 3. 14-Week Semester 5 Week-by-Week Execution Plan

### 📍 Phase 1: Research & API Architecture (Weeks 1–3)

#### **Week 1: API Response Standardization & Contract Specifications**
- [x] Define standardized REST response formats:
  - **Success Response:** `{ "success": true, "data": { ... }, "meta": { ... } }`
  - **Error Response:** `{ "success": false, "error": { "code": "ERR_CODE", "message": "...", "statusCode": 40x } }`
- [x] Write TypeScript interfaces and DTO specs for Auth, Users, Agents, Tools, and Policies (See [API_CONTRACT_SPECS.md](file:///d:/GitHub/SentinelAI/docs/API_CONTRACT_SPECS.md)).
- [x] Contribute to Literature Survey (Security & AI Governance reference papers documented in [API_CONTRACT_SPECS.md](file:///d:/GitHub/SentinelAI/docs/API_CONTRACT_SPECS.md)).

#### **Week 2: Backend Module Structure Design**
- [x] Map out NestJS module dependencies (`AuthModule`, `UsersModule`, `AgentsModule`, `ToolsModule`, `PoliciesModule`, `PrismaModule`).
- [x] Define RBAC role & permission requirements per API endpoint (See [ARCHITECTURE_AND_SEQUENCE_DIAGRAMS.md](file:///d:/GitHub/SentinelAI/docs/ARCHITECTURE_AND_SEQUENCE_DIAGRAMS.md)).

#### **Week 3: System Architecture & Sequence Diagrams**
- [x] Draw **System Architecture Diagram** (NestJS application layer & request flow).
- [x] Draw **Sequence Diagrams** (Auth Flow, RBAC Guard Flow, Agent & Tool Workflow - See [ARCHITECTURE_AND_SEQUENCE_DIAGRAMS.md](file:///d:/GitHub/SentinelAI/docs/ARCHITECTURE_AND_SEQUENCE_DIAGRAMS.md)).

---

### 📍 Phase 2: NestJS Setup & Global Pipes (Weeks 4–5)

#### **Week 4: NestJS Repository & Environment Setup**
- [x] Initialize NestJS application in `backend/` directory (`package.json`, `tsconfig.json`, `nest-cli.json`).
- [x] Configure `.env` and `.env.example` (`PORT=3001`, `JWT_SECRET`, `FRONTEND_URL`).
- [x] Setup `@nestjs/swagger` OpenAPI server at `http://localhost:3001/api/docs`.
- [x] Configure global NestJS `ValidationPipe` (`transform: true, whitelist: true, forbidNonWhitelisted: true`).

#### **Week 5: Global Exception Filters & CORS**
- [x] Implement Global HTTP Exception Filter (`GlobalHttpExceptionFilter`) to format API errors cleanly.
- [x] Configure CORS middleware for Frontend (`http://localhost:3000`).
- [x] Define UserRole enum & `@Roles()` decorator metadata.

---

### 📍 Phase 3: Auth, RBAC & Core API Controllers (Weeks 6–11)

#### **Week 6: Authentication Services (`AuthModule`)**
- [x] `AuthService.register()`: Hash password with `bcrypt` (12 rounds) and create user profile.
- [x] `AuthService.login()`: Validate password hash, sign JWT bearer token with user ID and Role.
- [x] `POST /auth/register` & `POST /auth/login` controllers ([AuthController](file:///d:/GitHub/SentinelAI/backend/src/auth/auth.controller.ts)).
- [x] `POST /auth/logout` & `GET /auth/me` controllers.

#### **Week 7: RBAC Decorators & Guard Implementation**
- [x] Create `@Roles(...)` custom metadata decorator ([roles.decorator.ts](file:///d:/GitHub/SentinelAI/backend/src/common/decorators/roles.decorator.ts)).
- [x] Implement `JwtAuthGuard` (Extract & verify Bearer token from headers - [jwt-auth.guard.ts](file:///d:/GitHub/SentinelAI/backend/src/auth/guards/jwt-auth.guard.ts)).
- [x] Implement `RolesGuard` (Check active user's role against allowed route roles - [roles.guard.ts](file:///d:/GitHub/SentinelAI/backend/src/auth/guards/roles.guard.ts)).
- [x] Enforce 401 Unauthorized and 403 Forbidden status code responses.

#### **Week 8: Users Management Controller (`UsersModule`)**
- [x] `GET /users` — List users (`SUPER_ADMIN` only - [UsersController](file:///d:/GitHub/SentinelAI/backend/src/users/users.controller.ts)).
- [x] `GET /users/:id` — View profile (`SUPER_ADMIN`, `ADMIN`, or self).
- [x] `PATCH /users/:id` — Update profile details.
- [x] `PATCH /users/:id/role` — Role promotion/demotion (`SUPER_ADMIN` only).

#### **Week 9: Agents & Agent-Tools Controller (`AgentsModule`)**
- [x] `POST /agents` — Register agent (`ADMIN`, `SUPER_ADMIN` - [AgentsController](file:///d:/GitHub/SentinelAI/backend/src/agents/agents.controller.ts)).
- [x] `GET /agents` & `GET /agents/:id` — Fetch agents.
- [x] `PATCH /agents/:id` & `DELETE /agents/:id`.
- [x] `POST /agents/:id/tools` — Attach allowed tool capabilities to an agent.

#### **Week 10: Tools Registry Controller (`ToolsModule`)**
- [x] `POST /tools` — Register tool (`SUPER_ADMIN` - [ToolsController](file:///d:/GitHub/SentinelAI/backend/src/tools/tools.controller.ts)).
- [x] `GET /tools` — List available tools and risk levels.
- [x] `PATCH /tools/:id` — Update tool risk level and required permission key.

#### **Week 11: Policies Governance Controller (`PoliciesModule`)**
- [x] `POST /policies` — Create governance policy (`ADMIN`, `SUPER_ADMIN` - [PoliciesController](file:///d:/GitHub/SentinelAI/backend/src/policies/policies.controller.ts)).
- [x] `GET /policies` & `GET /policies/:id`.
- [x] `PATCH /policies/:id` & `DELETE /policies/:id`.
- [x] Implement Policy Rules evaluation helper logic (`DENY` or `REQUIRE_CONFIRMATION` rules).

---

### 📍 Phase 4: Integration, Unit Tests & Presentation (Weeks 12–14)

#### **Week 12: Frontend Integration Support**
- [x] Configure CORS and standardized payload wrappers for Member 1 & Member 2.
- [x] DTO validation error formatting via Global ValidationPipe & Exception Filter.

#### **Week 13: Unit Testing & Swagger Documentation Polish**
- [x] Write Jest unit tests (`.spec.ts`) for `AuthService` ([auth.service.spec.ts](file:///d:/GitHub/SentinelAI/backend/src/auth/auth.service.spec.ts)).
- [x] Ensure 100% complete Swagger UI OpenAPI documentation with example request/response DTOs at `http://localhost:3001/api/docs`.

#### **Week 14: Semester 5 Presentation & Live Demo**
- [ ] Prepare live evaluation demo walkthrough.
- [ ] Submit Phase 1-4 Backend Documentation package.

---

## 4. Semester 5 Pure Backend API Surface

```http
# Authentication
POST   /auth/register          Roles: Public
POST   /auth/login             Roles: Public
POST   /auth/logout            Roles: Authenticated
GET    /auth/me                Roles: Authenticated

# Users Management
GET    /users                  Roles: SUPER_ADMIN
GET    /users/:id              Roles: SUPER_ADMIN, ADMIN, Self
PATCH  /users/:id              Roles: SUPER_ADMIN, Self
PATCH  /users/:id/role         Roles: SUPER_ADMIN

# Agents Management
POST   /agents                 Roles: ADMIN, SUPER_ADMIN
GET    /agents                 Roles: Authenticated
GET    /agents/:id             Roles: Authenticated
PATCH  /agents/:id             Roles: ADMIN, SUPER_ADMIN, DEVELOPER (own)
DELETE /agents/:id             Roles: ADMIN, SUPER_ADMIN
POST   /agents/:id/tools       Roles: ADMIN, SUPER_ADMIN

# Tools Registry
POST   /tools                  Roles: SUPER_ADMIN
GET    /tools                  Roles: Authenticated
PATCH  /tools/:id              Roles: SUPER_ADMIN

# Governance Policies
POST   /policies               Roles: ADMIN, SUPER_ADMIN
GET    /policies               Roles: Authenticated
GET    /policies/:id           Roles: Authenticated
PATCH  /policies/:id           Roles: ADMIN, SUPER_ADMIN
DELETE /policies/:id           Roles: SUPER_ADMIN
```
