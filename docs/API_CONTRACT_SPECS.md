# SentinelAI — API Contract Specifications & TypeScript DTOs
## Member 3 Deliverable · Semester 5 Week 1

---

## 1. Standardized API Response Formats

All NestJS API endpoints in SentinelAI MUST return responses formatted strictly according to the standard interfaces below.

### 1.1 Success Response Wrapper
```typescript
export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}
```

**Example JSON Output (HTTP 200/201):**
```json
{
  "success": true,
  "data": {
    "id": "agent-uuid-1234",
    "name": "Research Assistant",
    "type": "RESEARCH",
    "status": "ACTIVE"
  },
  "meta": {
    "timestamp": "2026-08-11T20:36:00.000Z"
  }
}
```

---

### 1.2 Error Response Wrapper
```typescript
export interface ApiResponseError {
  success: false;
  error: {
    code: string;       // Human-readable error identifier, e.g. "AUTH_INVALID_CREDENTIALS"
    message: string;    // Actionable message or validation error details
    statusCode: number; // Standard HTTP status code (400, 401, 403, 404, 409, 422, 500)
    details?: string[] | Record<string, any>;
  };
}
```

**Example JSON Output (HTTP 403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Role 'DEVELOPER' is not permitted to create global policies.",
    "statusCode": 403
  }
}
```

---

## 2. Authentication Interfaces & DTOs (`/auth`)

```typescript
// Roles Enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

// Request DTOs
export interface RegisterDto {
  email: string;       // Valid email format
  name: string;        // Min length 2
  password: string;    // Min length 8, contains letters and numbers
}

export interface LoginDto {
  email: string;
  password: string;
}

// Response Payloads
export interface AuthTokenPayload {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // 3600 seconds (1 hour)
  user: UserProfilePayload;
}

export interface UserProfilePayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
```

---

## 3. Users Management Interfaces & DTOs (`/users`)

```typescript
export interface UpdateUserDto {
  name?: string;
  isActive?: boolean;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface UserQueryDto {
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
```

---

## 4. Agents & Capabilities Interfaces & DTOs (`/agents`)

```typescript
export enum AgentType {
  RESEARCH = 'RESEARCH',
  EMAIL = 'EMAIL',
  DATABASE = 'DATABASE',
  CODING = 'CODING',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Request DTOs
export interface CreateAgentDto {
  name: string;
  description: string;
  type: AgentType;
  riskLevel?: RiskLevel; // Default: MEDIUM
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  status?: AgentStatus;
  riskLevel?: RiskLevel;
}

export interface AssignToolsDto {
  toolIds: string[]; // List of tool UUIDs allowed for this agent
}

// Response Payload
export interface AgentDetailPayload {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  riskLevel: RiskLevel;
  ownerId: string;
  tools: {
    id: string;
    name: string;
    riskLevel: RiskLevel;
    isAllowed: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Tools Registry Interfaces & DTOs (`/tools`)

```typescript
export interface CreateToolDto {
  name: string;               // e.g. "WEB_SEARCH", "SEND_EMAIL", "EXECUTE_SQL"
  description: string;
  riskLevel: RiskLevel;
  requiredPermission: string; // e.g. "tools:web_search"
}

export interface UpdateToolDto {
  description?: string;
  riskLevel?: RiskLevel;
  requiredPermission?: string;
  isActive?: boolean;
}
```

---

## 6. Security Policies Interfaces & DTOs (`/policies`)

```typescript
export enum PolicyEffect {
  DENY = 'DENY',
  REQUIRE_CONFIRMATION = 'REQUIRE_CONFIRMATION',
}

export interface CreatePolicyRuleDto {
  agentType?: AgentType;  // null = applies to all agent types
  toolName?: string;      // null = applies to all tools
  operation?: string;     // e.g. "DELETE", "SEND_EMAIL", "DROP_TABLE"
  effect: PolicyEffect;
  reason: string;
}

export interface CreatePolicyDto {
  name: string;
  description: string;
  isActive?: boolean;
  rules: CreatePolicyRuleDto[];
}

export interface UpdatePolicyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}
```

---

## 7. Literature Survey — Key Security Papers & Reference Concepts

| # | Paper Title / Focus Domain | Key Security Takeaway | SentinelAI Implementation Relevance |
|---|---|---|---|
| 1 | *Not What You've Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection* (Greshake et al.) | Indirect prompt injection allows attackers to manipulate AI tools via external untrusted inputs. | Establishes the necessity for an inline security gateway evaluating prompts prior to tool calls. |
| 2 | *Jailbreaking ChatGPT via Prompt Engineering: An Empirical Study* (Shen et al.) | Jailbreak prompts bypass safety alignment by framing malicious requests inside roleplay or encoded contexts. | Requires multi-layer prompt inspection (regex heuristics + structural analysis). |
| 3 | *Formalizing AI Governance & Access Control in Enterprise Systems* | Traditional RBAC must be adapted for dynamic agent capabilities to prevent privilege escalation. | Justifies `@Roles()` decorator guards and agent-to-tool binding matrix (`AgentTool`). |
| 4 | *Explainable AI in Security Operations Centers* | Security analysts require clear, human-readable rationales for why an action was blocked. | Mandates structured `explanation` and `riskBreakdown` JSON outputs for every decision. |
