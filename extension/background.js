const daemonUrl = 'http://127.0.0.1:8765/daemon/intercept';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'BROWSER_EVENT') return;

  fetch(daemonUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: 'sentinel-browser-extension',
      agent_type: 'BROWSER',
      action_type: message.actionType || 'BROWSER_EVENT',
      operation: message.operation || 'READ',
      target_url: message.url || sender.tab?.url || null,
      command: 'browser extension event'
    })
  })
    .then((response) => response.json())
    .then((decision) => sendResponse({ ok: true, decision }))
    .catch(() => sendResponse({ ok: false, decision: { decision: 'BLOCK', explanation: 'Daemon unavailable' } }));

  return true;
});
