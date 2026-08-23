create type user_role as enum ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'VIEWER');
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

insert into users (id, email, name, password_hash, role) values
('usr-superadmin-001', 'admin@sentinelai.io', 'Super Admin User', '$2b$12$BJiV6oETQQ4vUjr5DppE4./zE41E0kW5x4.e5OSPlxJYQtanQFLLO', 'SUPER_ADMIN')
on conflict (email) do nothing;
insert into tools (id, name, description, risk_level, required_permission) values
('tool-web-search', 'WEB_SEARCH', 'Searches web resources for public real-time data.', 'LOW', 'tools:web_search'),
('tool-send-email', 'SEND_EMAIL', 'Sends external emails on behalf of the user.', 'MEDIUM', 'tools:send_email'),
('tool-db-query', 'EXECUTE_SQL', 'Executes SQL database queries against core databases.', 'HIGH', 'tools:execute_sql')
on conflict (id) do nothing;
insert into policies (id, name, description) values
('pol-data-protection-01', 'Default Enterprise Security & Data Protection', 'Global governance policy for protected actions.')
on conflict (id) do nothing;
insert into policy_rules (id, policy_id, tool_name, operation, effect, reason) values
('rule-01', 'pol-data-protection-01', 'EXECUTE_SQL', 'DROP', 'DENY', 'Executing DROP SQL statements is strictly forbidden.')
on conflict (id) do nothing;
