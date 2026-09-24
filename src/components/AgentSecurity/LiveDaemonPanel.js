import {
  endDaemonSession,
  getDaemonStatus,
  getRecentActions,
  interceptDaemonAction,
  startDaemonSession
} from '../../services/daemonApi.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createLiveDaemonPanel(toast = { show: () => {} }) {
  const panel = document.createElement('section');
  panel.className = 'tactical-card p-3.5 flex flex-col gap-3';
  panel.style.border = '1px solid rgba(147, 204, 255, 0.42)';
  panel.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div>
        <div class="font-label-caps text-primary" style="color: var(--color-primary);">LIVE DAEMON CONTROL PLANE</div>
        <h2 class="font-headline-sm text-on-surface font-bold" style="font-size: 15px;">REAL INTERCEPTION TELEMETRY</h2>
      </div>
      <span id="live-daemon-state" class="badge-normal">CONNECTING</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div class="lg:col-span-4 p-3 rounded" style="background: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.35);">
        <div class="font-label-caps text-outline">DAEMON STATUS</div>
        <div id="live-daemon-status" class="font-headline-md text-on-surface" style="margin-top: 8px;">Checking...</div>
        <div id="live-daemon-meta" class="font-code-sm text-outline" style="margin-top: 4px;">Port 8765</div>
      </div>

      <form id="live-session-form" class="lg:col-span-4 p-3 flex flex-col gap-2 rounded" style="background: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.35);">
        <div class="font-label-caps text-outline">SESSION CONTROL</div>
        <input name="task" required value="Portal security review" class="font-code-sm" placeholder="Task description" style="background: var(--color-surface-high); border: 1px solid var(--color-outline-variant); color: var(--color-on-surface); padding: 7px 8px; border-radius: 3px;" />
        <input name="paths" value="d:/GitHub/SentinelAI" class="font-code-sm" placeholder="Granted path" style="background: var(--color-surface-high); border: 1px solid var(--color-outline-variant); color: var(--color-on-surface); padding: 7px 8px; border-radius: 3px;" />
        <div class="flex gap-2">
          <button type="submit" class="btn-primary" style="font-size: 10px;">START SESSION</button>
          <button id="live-session-end" type="button" class="btn-secondary" style="font-size: 10px;">END</button>
        </div>
      </form>

      <form id="live-intercept-form" class="lg:col-span-4 p-3 flex flex-col gap-2 rounded" style="background: var(--color-surface-lowest); border: 1px solid rgba(164, 2, 23, 0.4);">
        <div class="font-label-caps text-error">SAFE REQUEST TESTER</div>
        <input name="path" required value="~/.ssh/id_rsa" class="font-code-sm" placeholder="Target path" style="background: var(--color-surface-high); border: 1px solid var(--color-outline-variant); color: var(--color-on-surface); padding: 7px 8px; border-radius: 3px;" />
        <div class="flex gap-2">
          <select name="operation" class="font-code-sm" style="flex: 1; background: var(--color-surface-high); border: 1px solid var(--color-outline-variant); color: var(--color-on-surface); padding: 7px 8px; border-radius: 3px;">
            <option value="DELETE">DELETE</option>
            <option value="READ">READ</option>
            <option value="WRITE">WRITE</option>
          </select>
          <button type="submit" class="btn-danger" style="font-size: 10px;">EVALUATE</button>
        </div>
      </form>
    </div>

    <div class="p-3 rounded" style="background: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center justify-between mb-2">
        <div class="font-label-caps text-outline">RECENT ACTIONS</div>
        <button id="live-refresh-actions" class="btn-secondary" style="font-size: 10px;">REFRESH</button>
      </div>
      <div id="live-action-list" class="flex flex-col gap-1.5"><span class="font-code-sm text-outline">Waiting for daemon...</span></div>
    </div>

    <div id="live-decision-result" class="hidden p-3 rounded" style="background: var(--color-surface-container); border: 1px solid var(--color-outline-variant);">
      <div class="font-label-caps text-outline">LAST INTERCEPTION DECISION</div>
      <div id="live-decision-text" class="font-headline-sm text-on-surface" style="margin-top: 6px;"></div>
      <div id="live-decision-reason" class="font-code-sm text-outline" style="margin-top: 4px;"></div>
    </div>
  `;

  let activeSessionId = null;
  const state = panel.querySelector('#live-daemon-state');
  const status = panel.querySelector('#live-daemon-status');
  const meta = panel.querySelector('#live-daemon-meta');
  const actionList = panel.querySelector('#live-action-list');
  const decisionResult = panel.querySelector('#live-decision-result');
  const decisionText = panel.querySelector('#live-decision-text');
  const decisionReason = panel.querySelector('#live-decision-reason');

  function renderActions(actions) {
    if (!actions.length) {
      actionList.innerHTML = '<span class="font-code-sm text-outline">No intercepted actions recorded.</span>';
      return;
    }

    actionList.innerHTML = actions.map((action) => `
      <div class="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5" style="background: var(--color-surface-container); border-left: 2px solid ${action.outcome.includes('BLOCK') ? 'var(--color-error)' : 'var(--color-emerald)'};">
        <span class="font-code-sm text-on-surface">${escapeHtml(action.action_type)} <span class="text-outline">${escapeHtml(action.target_path || 'no path')}</span></span>
        <span class="font-label-caps" style="color: ${action.outcome.includes('BLOCK') ? 'var(--color-error)' : 'var(--color-emerald)'};">${escapeHtml(action.outcome)} // ${action.risk_score}</span>
      </div>
    `).join('');
  }

  async function refresh() {
    try {
      const [daemon, actions] = await Promise.all([getDaemonStatus(), getRecentActions()]);
      activeSessionId = daemon.active_session_id;
      state.textContent = daemon.running ? 'ONLINE' : 'OFFLINE';
      state.className = daemon.running ? 'badge-emerald' : 'badge-critical';
      status.textContent = daemon.running ? 'PROTECTION ACTIVE' : 'DAEMON OFFLINE';
      meta.textContent = `Port 8765 // v${escapeHtml(daemon.version)} // Circuit ${escapeHtml(daemon.circuit_breaker_state)}`;
      renderActions(actions);
    } catch (error) {
      state.textContent = 'OFFLINE';
      state.className = 'badge-critical';
      status.textContent = 'DAEMON UNREACHABLE';
      meta.textContent = 'Start sentinel.main on port 8765';
      actionList.innerHTML = '<span class="font-code-sm text-error">Live telemetry unavailable.</span>';
    }
  }

  panel.querySelector('#live-session-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const session = await startDaemonSession({
        agent_id: 'member1-portal',
        task_description: form.get('task'),
        granted_paths: String(form.get('paths')).split(',').map((path) => path.trim()).filter(Boolean)
      });
      activeSessionId = session.session_id;
      toast.show(`Session ${session.session_id.slice(0, 8)} started.`, 'success');
      refresh();
    } catch (error) {
      toast.show('Unable to start daemon session.', 'error');
    }
  });

  panel.querySelector('#live-session-end').addEventListener('click', async () => {
    if (!activeSessionId) {
      toast.show('No active session to end.', 'info');
      return;
    }
    try {
      await endDaemonSession(activeSessionId);
      activeSessionId = null;
      toast.show('Daemon session ended.', 'success');
      refresh();
    } catch (error) {
      toast.show('Unable to end daemon session.', 'error');
    }
  });

  panel.querySelector('#live-intercept-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await interceptDaemonAction({
        agent_id: 'member1-portal',
        agent_type: 'SHELL',
        session_id: activeSessionId,
        action_type: `FILE_${form.get('operation') === 'READ' ? 'READ' : form.get('operation') === 'WRITE' ? 'WRITE' : 'DELETE'}`,
        operation: form.get('operation'),
        target_path: form.get('path'),
        command: `portal test ${form.get('operation')} ${form.get('path')}`
      });
      const resultType = result.decision === 'BLOCK' ? 'error' : 'success';
      decisionResult.classList.remove('hidden');
      decisionText.textContent = `${result.decision} // RISK ${result.risk_score} // ${result.risk_category}`;
      decisionText.style.color = result.decision === 'BLOCK' ? 'var(--color-error)' : 'var(--color-emerald)';
      decisionReason.textContent = `${result.reason_code}: ${result.explanation}`;
      toast.show(`${result.decision}: risk ${result.risk_score} (${result.risk_category})`, resultType);
      refresh();
    } catch (error) {
      toast.show('Interception request failed.', 'error');
    }
  });

  panel.querySelector('#live-refresh-actions').addEventListener('click', refresh);
  refresh();
  return panel;
}
