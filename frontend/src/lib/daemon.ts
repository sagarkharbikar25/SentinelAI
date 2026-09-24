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

const daemonUrl = process.env.NEXT_PUBLIC_DAEMON_URL ?? 'http://127.0.0.1:8765';

async function daemonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${daemonUrl}${path}`, { ...init, cache: 'no-store' });
  if (!response.ok) throw new Error(`Daemon request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function getDaemonStatus() {
  return daemonFetch<DaemonStatus>('/daemon/status');
}

export function getRecentActions() {
  return daemonFetch<ActionLog[]>('/daemon/actions?limit=50');
}

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
