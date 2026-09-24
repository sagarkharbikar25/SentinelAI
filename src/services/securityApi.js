const DAEMON_URL = 'http://127.0.0.1:8765';

async function request(path, options = {}) {
  const response = await fetch(`${DAEMON_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`Daemon request failed (${response.status})`);
  return response.json();
}

export const getDaemonStatus = () => request('/daemon/status');
export const getRecentActions = (limit = 10) => request(`/daemon/actions?limit=${limit}`);
export const getAlerts = () => request('/daemon/alerts?unread_only=true');
export const markAlertRead = (id) => request(`/daemon/alerts/${id}/read`, { method: 'POST' });
export const getPolicies = () => request('/daemon/policies');
export const getTools = () => request('/daemon/tools');
export const createPolicy = (payload) => request('/daemon/policies', { method: 'POST', body: JSON.stringify(payload) });
export const interceptAction = (payload) => request('/daemon/intercept', { method: 'POST', body: JSON.stringify(payload) });
