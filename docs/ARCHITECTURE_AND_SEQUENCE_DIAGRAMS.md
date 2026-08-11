# SentinelAI — System Architecture, Module Maps & Sequence Diagrams
## Member 3 Deliverable · Semester 5 Weeks 2 & 3

---

## 1. NestJS Module Dependency Architecture

```mermaid
graph TD
    AppModule["AppModule (Root)"]
    AuthModule["AuthModule"]
    UsersModule["UsersModule"]
    AgentsModule["AgentsModule"]
    ToolsModule["ToolsModule"]
    PoliciesModule["PoliciesModule"]
    PrismaModule["PrismaModule (Shared DB Client)"]

    AppModule --> AuthModule
    AppModule --> UsersModule
    AppModule --> AgentsModule
    AppModule --> ToolsModule
    AppModule --> PoliciesModule

    AuthModule --> UsersModule
    AuthModule --> PrismaModule
    UsersModule --> PrismaModule
    AgentsModule --> ToolsModule
    AgentsModule --> PrismaModule
    ToolsModule --> PrismaModule
    PoliciesModule --> PrismaModule
```

---

## 2. API Endpoint RBAC Permission Map

| Module | Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|---|
| **Auth** | `/auth/register` | `POST` | Public | Register new user account |
| **Auth** | `/auth/login` | `POST` | Public | Authenticate user & issue JWT |
| **Auth** | `/auth/logout` | `POST` | All Authenticated | Invalidate session / client token |
| **Auth** | `/auth/me` | `GET` | All Authenticated | Fetch current user profile & role |
| **Users** | `/users` | `GET` | `SUPER_ADMIN` | List all users |
| **Users** | `/users/:id` | `GET` | `SUPER_ADMIN`, `ADMIN`, Self | Fetch user profile details |
| **Users** | `/users/:id` | `PATCH` | `SUPER_ADMIN`, Self | Update user profile |
| **Users** | `/users/:id/role` | `PATCH` | `SUPER_ADMIN` | Change user system role |
| **Agents** | `/agents` | `POST` | `ADMIN`, `SUPER_ADMIN` | Register new AI agent |
| **Agents** | `/agents` | `GET` | All Authenticated | List all registered agents |
| **Agents** | `/agents/:id` | `GET` | All Authenticated | View agent details & capabilities |
| **Agents** | `/agents/:id` | `PATCH` | `ADMIN`, `SUPER_ADMIN`, Owner | Update agent parameters |
| **Agents** | `/agents/:id` | `DELETE` | `ADMIN`, `SUPER_ADMIN` | Delete/deactivate agent |
| **Agents** | `/agents/:id/tools` | `POST` | `ADMIN`, `SUPER_ADMIN` | Assign allowed tools to agent |
| **Tools** | `/tools` | `POST` | `SUPER_ADMIN` | Register new tool in system |
| **Tools** | `/tools` | `GET` | All Authenticated | List all registered tools |
| **Tools** | `/tools/:id` | `PATCH` | `SUPER_ADMIN` | Update tool risk level & permissions |
| **Policies**| `/policies` | `POST` | `ADMIN`, `SUPER_ADMIN` | Create governance policy |
| **Policies**| `/policies` | `GET` | All Authenticated | List governance policies |
| **Policies**| `/policies/:id` | `GET` | All Authenticated | View specific policy details |
| **Policies**| `/policies/:id` | `PATCH` | `ADMIN`, `SUPER_ADMIN` | Update policy rules |
| **Policies**| `/policies/:id` | `DELETE` | `SUPER_ADMIN` | Delete governance policy |

---

## 3. Sequence Diagrams

### 3.1 Authentication Sequence Flow (Register $\rightarrow$ Login $\rightarrow$ JWT Issue)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / User
    participant Controller as AuthController
    participant Service as AuthService
    participant Bcrypt as Bcrypt Utility
    participant JWT as JwtService
    participant DB as Prisma (User DB)

    Note over User, DB: User Registration
    User->>Controller: POST /auth/register {email, name, password}
    Controller->>Service: register(dto)
    Service->>Bcrypt: hash(password, 12 rounds)
    Bcrypt-->>Service: hashedPassword
    Service->>DB: user.create({email, name, hashedPassword, role: VIEWER})
    DB-->>Service: createdUser
    Service-->>Controller: UserProfilePayload
    Controller-->>User: HTTP 201 { success: true, data: user }

    Note over User, DB: User Login
    User->>Controller: POST /auth/login {email, password}
    Controller->>Service: login(dto)
    Service->>DB: user.findUnique({email})
    DB-->>Service: user
    Service->>Bcrypt: compare(password, user.passwordHash)
    Bcrypt-->>Service: isValid (true)
    Service->>JWT: sign({sub: user.id, email: user.email, role: user.role})
    JWT-->>Service: accessToken
    Service-->>Controller: AuthTokenPayload
    Controller-->>User: HTTP 200 { success: true, data: { accessToken, user } }
```

---

### 3.2 RBAC Security Guard Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Authenticated Client
    participant Guard1 as JwtAuthGuard
    participant Guard2 as RolesGuard
    participant Reflector as Reflector (Metadata)
    participant Controller as Protected Controller

    Client->>Guard1: HTTP Request with Bearer Token Header
    alt Missing or Invalid Token
        Guard1-->>Client: HTTP 401 Unauthorized { success: false, error: "AUTH_UNAUTHORIZED" }
    else Valid JWT Token
        Guard1->>Guard1: Attach decoded payload to req.user
        Guard1->>Guard2: Pass execution context
        Guard2->>Reflector: get(@Roles(), handler)
        Reflector-->>Guard2: Required Roles [ADMIN, SUPER_ADMIN]
        alt User Role does NOT match
            Guard2-->>Client: HTTP 403 Forbidden { success: false, error: "INSUFFICIENT_PERMISSIONS" }
        else User Role matches Required Roles
            Guard2->>Controller: Execute Controller Handler Method
            Controller-->>Client: HTTP 200/201 Success Response Payload
        end
    end
```

---

### 3.3 Agent & Tool Registration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    participant AgentCtrl as AgentsController
    participant AgentSvc as AgentsService
    participant DB as Prisma DB

    Admin->>AgentCtrl: POST /agents {name, type: RESEARCH, riskLevel: MEDIUM}
    AgentCtrl->>AgentSvc: createAgent(adminId, dto)
    AgentSvc->>DB: agent.create(...)
    DB-->>AgentSvc: createdAgent
    AgentSvc-->>AgentCtrl: agentData
    AgentCtrl-->>Admin: HTTP 201 Created

    Admin->>AgentCtrl: POST /agents/:id/tools {toolIds: ["tool-1", "tool-2"]}
    AgentCtrl->>AgentSvc: assignTools(agentId, toolIds)
    AgentSvc->>DB: agentTool.createMany(...)
    DB-->>AgentSvc: success
    AgentSvc-->>AgentCtrl: updatedAgentWithTools
    AgentCtrl-->>Admin: HTTP 200 OK { success: true, data: agentWithTools }
```
