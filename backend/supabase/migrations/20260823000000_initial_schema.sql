create type user_role as enum ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'ANALYST', 'VIEWER');
create type agent_type as enum ('RESEARCH', 'EMAIL', 'DATABASE', 'CODING');
create type agent_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
create type risk_level as enum ('LOW', 'MEDIUM', 'HIGH');
create type policy_effect as enum ('DENY', 'REQUIRE_CONFIRMATION');
create type request_decision as enum ('ALLOW', 'WARN', 'BLOCK');

create table users (
  id text primary key, email text unique not null, name text not null,
  password_hash text not null, role user_role not null default 'VIEWER',
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table tools (
  id text primary key, name text unique not null, description text not null,
  risk_level risk_level not null, required_permission text not null,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table agents (
  id text primary key, name text not null, description text not null,
  type agent_type not null, status agent_status not null default 'ACTIVE',
  risk_level risk_level not null default 'MEDIUM', owner_id text not null references users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table agent_tools (
  agent_id text not null references agents(id) on delete cascade,
  tool_id text not null references tools(id) on delete cascade,
  primary key (agent_id, tool_id)
);
create table policies (
  id text primary key, name text unique not null, description text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table policy_rules (
  id text primary key, policy_id text not null references policies(id) on delete cascade,
  agent_type agent_type, tool_name text, operation text, effect policy_effect not null, reason text not null
);
create table requests (
  id text primary key, agent_id text not null references agents(id), prompt_hash text not null,
  decision request_decision not null, created_at timestamptz not null default now()
);
create table audit_logs (
  id text primary key, user_id text references users(id), action text not null,
  resource text not null, metadata jsonb, created_at timestamptz not null default now()
);
create table sessions (
  id text primary key, user_id text not null references users(id) on delete cascade,
  token text unique not null, expires_at timestamptz not null
);

create index idx_requests_agent_id on requests(agent_id);
create index idx_requests_created_at on requests(created_at desc);
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_created_at on audit_logs(created_at desc);
create index idx_sessions_token on sessions(token);
create index idx_sessions_expires_at on sessions(expires_at);

-- Seed System Users (Super Admin, Admin, Developer, Analyst)
insert into users (id, email, name, password_hash, role) values
('usr-superadmin-001', 'admin@sentinelai.io', 'Super Admin User', '$2b$12$BJiV6oETQQ4vUjr5DppE4./zE41E0kW5x4.e5OSPlxJYQtanQFLLO', 'SUPER_ADMIN'),
('usr-developer-002', 'dev@sentinelai.io', 'Developer User', '$2b$12$V.vT2vQoE8dZgZ2KzL3t4O.5QxVjV4WzE5R8XzYzA1B2C3D4E5F6G', 'DEVELOPER'),
('usr-analyst-003', 'analyst@sentinelai.io', 'Security Analyst', '$2b$12$W.wU3wRpF9eaAh3LA4u5P.6RyWkW5XA1S9YaZbB2C3D4E5F6G7H', 'ANALYST')
on conflict (email) do nothing;

-- Seed Tools (5 System Tools)
insert into tools (id, name, description, risk_level, required_permission) values
('tool-web-search', 'WEB_SEARCH', 'Searches web resources for public real-time data.', 'LOW', 'tools:web_search'),
('tool-send-email', 'SEND_EMAIL', 'Sends external emails on behalf of the user.', 'MEDIUM', 'tools:send_email'),
('tool-db-query', 'EXECUTE_SQL', 'Executes SQL database queries against core databases.', 'HIGH', 'tools:execute_sql'),
('tool-read-file', 'READ_FILE', 'Reads local document repository files.', 'LOW', 'tools:read_file'),
('tool-call-api', 'CALL_API', 'Invokes external third-party HTTP APIs.', 'MEDIUM', 'tools:call_api')
on conflict (id) do nothing;

-- Seed Sample Agents (4 Agents)
insert into agents (id, name, description, type, status, risk_level, owner_id) values
('agent-research-01', 'Research & Search Agent', 'Autonomously gathers literature and searches web sources.', 'RESEARCH', 'ACTIVE', 'LOW', 'usr-superadmin-001'),
('agent-email-02', 'Enterprise Email Assistant', 'Drafts and sends external email responses.', 'EMAIL', 'ACTIVE', 'MEDIUM', 'usr-developer-002'),
('agent-database-03', 'Database Analytics Assistant', 'Runs SQL queries for reporting.', 'DATABASE', 'ACTIVE', 'HIGH', 'usr-superadmin-001'),
('agent-coding-04', 'Code Security Scanner', 'Scans repository code for vulnerabilities.', 'CODING', 'ACTIVE', 'MEDIUM', 'usr-developer-002')
on conflict (id) do nothing;

-- Seed Agent Tool Capabilities
insert into agent_tools (agent_id, tool_id) values
('agent-research-01', 'tool-web-search'),
('agent-research-01', 'tool-read-file'),
('agent-email-02', 'tool-web-search'),
('agent-email-02', 'tool-send-email'),
('agent-database-03', 'tool-db-query'),
('agent-coding-04', 'tool-read-file'),
('agent-coding-04', 'tool-call-api')
on conflict (agent_id, tool_id) do nothing;

-- Seed Policies & Governance Rules
insert into policies (id, name, description) values
('pol-data-protection-01', 'Default Enterprise Security & Data Protection', 'Global governance policy for protected actions.')
on conflict (id) do nothing;

insert into policy_rules (id, policy_id, tool_name, operation, effect, reason) values
('rule-01', 'pol-data-protection-01', 'EXECUTE_SQL', 'DROP', 'DENY', 'Executing DROP SQL statements is strictly forbidden.'),
('rule-02', 'pol-data-protection-01', 'SEND_EMAIL', 'MASS_SEND', 'REQUIRE_CONFIRMATION', 'Mass email dispatch requires human analyst confirmation.')
on conflict (id) do nothing;
