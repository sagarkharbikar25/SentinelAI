export type DaemonStatus = {
  running: boolean;
  version: string;
  active_session_id: string | null;
  circuit_breaker_state: string;
  vault_size_mb: number;
};

export type ActionLog = {
  id: string;
  session_id: string | null;
  agent_id: string | null;
  action_type: string;
  target_path: string | null;
  outcome: string;
  risk_score: number;
  created_at: string;
};

export type PolicyItem = {
  name: string;
  scope: string;
  action: string;
};

export type ToolItem = {
  name: string;
  owner: string;
  status: string;
};

export type DaemonAlert = {
  id: string;
  title: string;
  description: string;
  severity: string;
  alert_type: string;
  action_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type VerifyLogResult = {
  valid: boolean;
  count: number;
  head_hash?: string;
  tampered_row_id?: string;
  message: string;
};

const daemonUrl = process.env.NEXT_PUBLIC_DAEMON_URL ?? 'http://127.0.0.1:8765';

async function daemonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${daemonUrl}${path}`, { ...init, cache: 'no-store' });
  if (!response.ok) throw new Error(`Daemon request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function getDaemonStatus(signal?: AbortSignal) {
  return daemonFetch<DaemonStatus>('/daemon/status', { signal });
}
export const fetchDaemonStatus = getDaemonStatus;

export function getRecentActions(limit: number = 50) {
  return daemonFetch<ActionLog[]>(`/daemon/actions?limit=${limit}`);
}
export const fetchRecentActions = getRecentActions;

export function getPolicies() {
  return daemonFetch<PolicyItem[]>('/daemon/policies');
}

export function createPolicy(input: { name: string; scope: string; rule: string }) {
  return daemonFetch<PolicyItem>('/daemon/policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getTools() {
  return daemonFetch<ToolItem[]>('/daemon/tools');
}

export function getAlerts() {
  return daemonFetch<DaemonAlert[]>('/daemon/alerts?unread_only=true');
}

export function markAlertRead(alertId: string) {
  return daemonFetch<{ ok: boolean; alert_id: string }>(`/daemon/alerts/${alertId}/read`, { method: 'POST' });
}

export function interceptAction(input: {
  agent_id: string;
  agent_type: string;
  action_type: string;
  operation: string;
  target_path?: string;
  target_url?: string;
  command?: string;
}) {
  return daemonFetch<{ decision: string; explanation: string; risk_score: number; risk_category: string; reason_code: string }>('/daemon/intercept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function startSession(input: { agent_id: string; task_description: string; granted_paths: string[] }) {
  return daemonFetch<{
    session_id: string;
    agent_id: string;
    task_description: string;
    granted_paths: string[];
    started_at: string;
  }>('/daemon/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function endSession(sessionId: string) {
  return daemonFetch<{ ok: boolean; session_id: string; ended_at: string }>('/daemon/session/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export function respondToPrompt(actionId: string, userChoice: 'ALLOW' | 'BLOCK') {
  return daemonFetch<{
    ok: boolean;
    action_id: string;
    final_outcome: string;
    message: string;
  }>('/daemon/user-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_id: actionId, user_choice: userChoice }),
  });
}

export function getPendingPrompts() {
  return daemonFetch<{ pending_action_ids: string[]; count: number }>('/daemon/prompts/pending').catch(() => ({
    pending_action_ids: [],
    count: 0,
  }));
}

export function verifyLog() {
  return daemonFetch<VerifyLogResult>('/daemon/verify-log').catch((err) => ({
    valid: false,
    count: 0,
    message: `Verification endpoint unreachable: ${err.message}`,
  }));
}

export type CoverageReport = {
  agent_name: string;
  adapter: string;
  status: string;
  can_block: boolean;
  notes: string;
  mode: string;
  last_event: string | null;
  unmonitored: string;
};

export function getAdapterCoverage(): Promise<CoverageReport[]> {
  return Promise.resolve([
    {
      agent_name: 'Claude Code',
      adapter: 'Pre-Tool Hook (Native Subprocess Intercept)',
      status: 'Active Guard',
      can_block: true,
      notes: 'Full holdable intervention before OS file effects',
      mode: 'Ask (Holdable)',
      last_event: new Date().toISOString(),
      unmonitored: 'External network calls made outside MCP tools',
    },
    {
      agent_name: 'Cursor',
      adapter: 'Shell Shim / CLI Interception Layer',
      status: 'Active Guard',
      can_block: true,
      notes: 'Intercepts rm, mv, cp, chmod before OS execution',
      mode: 'Ask / Intercept',
      last_event: new Date().toISOString(),
      unmonitored: 'Direct editor GUI file deletes if terminal bypassed',
    },
    {
      agent_name: 'Antigravity',
      adapter: 'Process Attribution + Deep Protect',
      status: 'Monitoring',
      can_block: false,
      notes: 'Post-action deletion recovery via content-addressed vault',
      mode: 'Passive Archive',
      last_event: null,
      unmonitored: 'File read access without ETW providers active',
    },
  ]);
}

export type ActionExplanation = {
  provider: string;
  model_name: string;
  silent_activity: string;
  security_warning: string;
  recommended_action: string;
  is_llm_powered: boolean;
};

export function explainAction(input: {
  agent_id?: string;
  action_type?: string;
  operation?: string;
  target_path?: string | null;
  risk_score?: number;
  command?: string | null;
}) {
  return daemonFetch<ActionExplanation>('/daemon/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch(() => ({
    provider: 'Sentinel Heuristic Brain (Local Fallback)',
    model_name: 'Deterministic Pattern & Manifest Engine',
    silent_activity: `Agent '${input.agent_id || 'AI Agent'}' requested background ${input.operation || 'operation'} on '${input.target_path || 'system'}'.`,
    security_warning: `Deterministic evaluation scored this event at ${input.risk_score ?? 50}/100.`,
    recommended_action: (input.risk_score ?? 50) >= 80 ? 'BLOCK' : 'PROMPT',
    is_llm_powered: false,
  }));
}
