const DAEMON_URL = 'http://127.0.0.1:8765';

async function request(path, options = {}) {
  const response = await fetch(`${DAEMON_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Daemon request failed (${response.status})`);
  }

  return response.json();
}

export function getDaemonStatus() {
  return request('/daemon/status');
}

export function getRecentActions(limit = 8) {
  return request(`/daemon/actions?limit=${limit}`);
}

export function startDaemonSession(payload) {
  return request('/daemon/session/start', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function endDaemonSession(sessionId) {
  return request('/daemon/session/end', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId })
  });
}

export function interceptDaemonAction(payload) {
  return request('/daemon/intercept', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
