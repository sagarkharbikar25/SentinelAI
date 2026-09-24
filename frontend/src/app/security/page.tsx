 'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { ActionLog, DaemonAlert, DaemonStatus, getAlerts, getDaemonStatus, getRecentActions, interceptAction, markAlertRead } from '@/lib/daemon';

export default function SecurityCenterPage() {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [alerts, setAlerts] = useState<DaemonAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testerResult, setTesterResult] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [daemonStatus, recentActions, unreadAlerts] = await Promise.all([
        getDaemonStatus(),
        getRecentActions(),
        getAlerts(),
      ]);
      setStatus(daemonStatus);
      setActions(recentActions);
      setAlerts(unreadAlerts);
    } catch {
      setError('Daemon offline. Start the Python service on port 8765.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function dismissAlert(alertId: string) {
    await markAlertRead(alertId);
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
  }

  async function evaluateRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await interceptAction({
        agent_id: 'sentinel-request-tester',
        agent_type: 'SHELL',
        action_type: `FILE_${form.get('operation')}`,
        operation: String(form.get('operation')),
        target_path: String(form.get('target_path')),
        command: 'security center request tester',
      });
      setTesterResult(`${result.decision} // RISK ${result.risk_score} (${result.risk_category}) // ${result.reason_code}: ${result.explanation}`);
      refresh();
    } catch {
      setTesterResult('Daemon unavailable. Start the Python service on port 8765.');
    }
  }

  const blocked = actions.filter((action) => action.outcome.includes('BLOCK')).length;
  const allowed = actions.filter((action) => action.outcome.includes('ALLOW')).length;
  const averageRisk = actions.length ? Math.round(actions.reduce((sum, action) => sum + action.risk_score, 0) / actions.length) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">SYSTEM TELEMETRY // RUNTIME INTERCEPTOR</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Activity className="w-6 h-6 text-[#93CCFF]" /> Security Threat Center
        </h2>
          <p className="text-xs text-[#BFC7D2] mt-1">
            Live policy enforcement, risk scoring, alert triage, and daemon health.
        </p>
      </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 rounded bg-[#262A34] border border-[#3F4850] text-xs text-[#DFE2F0] hover:border-[#93CCFF]">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> SYNC TELEMETRY
        </button>
      </div>

      {error && <div className="portal-card p-3 text-sm text-[#FFB4AB] border-[#93000A]/70 flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</div>}

      <form onSubmit={evaluateRequest} className="portal-card p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
        <label className="block"><span className="portal-label">REQUEST TESTER // TARGET PATH</span><input name="target_path" required defaultValue="~/.ssh/id_rsa" className="mt-2 w-full rounded bg-[#0A0E17] border border-[#3F4850] px-3 py-2 text-sm text-white focus:border-[#93CCFF] focus:outline-none" /></label>
        <label className="block"><span className="portal-label">OPERATION</span><select name="operation" className="mt-2 w-full rounded bg-[#0A0E17] border border-[#3F4850] px-3 py-2 text-sm text-white focus:border-[#93CCFF] focus:outline-none"><option>DELETE</option><option>READ</option><option>WRITE</option></select></label>
        <button className="px-4 py-2 rounded bg-[#3198DC] text-[#002C47] font-bold text-xs hover:bg-[#93CCFF]" type="submit">EVALUATE REQUEST</button>
        {testerResult && <p className="md:col-span-3 text-xs text-[#FFB95F] font-mono">{testerResult}</p>}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'DAEMON STATUS', value: status?.running ? 'ONLINE' : 'OFFLINE', color: status?.running ? 'text-[#4EDEA3]' : 'text-[#FFB4AB]' },
          { label: 'RECENT ACTIONS', value: actions.length, color: 'text-[#93CCFF]' },
          { label: 'BLOCKED', value: blocked, color: 'text-[#FFB4AB]' },
          { label: 'AVG RISK SCORE', value: averageRisk, color: averageRisk > 70 ? 'text-[#FFB4AB]' : 'text-[#FFB95F]' },
        ].map((metric) => (
          <div key={metric.label} className="portal-card p-4">
            <p className="portal-label">{metric.label}</p>
            <p className={`text-2xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
            <p className="text-[11px] text-[#89929B] mt-1">{metric.label === 'DAEMON STATUS' ? `Circuit: ${status?.circuit_breaker_state ?? 'UNKNOWN'}` : 'Live daemon window'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
        <section className="portal-card p-4 xl:col-span-3">
          <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3">
            <div><p className="portal-label">ALERT FEED</p><h3 className="text-lg font-bold text-white mt-1">Unread Security Events</h3></div>
            <span className="text-[10px] px-2 py-1 rounded bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40">{alerts.length} UNREAD</span>
          </div>
          <div className="space-y-2 mt-3">
            {alerts.length === 0 && <p className="text-sm text-[#89929B] py-5">No unread alerts from the daemon.</p>}
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded bg-[#0A0E17] border border-[#3F4850]/50 flex items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#FFB95F]" /><span className="portal-label text-[#FFB95F]">{alert.severity}</span><span className="text-[10px] text-[#89929B]">{new Date(alert.created_at).toLocaleString()}</span></div><p className="text-sm font-bold text-white mt-1">{alert.title}</p><p className="text-xs text-[#BFC7D2] mt-1">{alert.description}</p></div>
                <button onClick={() => dismissAlert(alert.id)} className="text-[10px] text-[#93CCFF] hover:text-white whitespace-nowrap">MARK READ</button>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-card p-4 xl:col-span-2">
          <p className="portal-label">AGENT HEALTH</p>
          <h3 className="text-lg font-bold text-white mt-1">Runtime Protection</h3>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded bg-[#0A0E17]"><span className="text-sm text-white">Policy engine</span><span className="flex items-center gap-1 text-xs text-[#4EDEA3]"><CheckCircle2 className="w-4 h-4" /> ACTIVE</span></div>
            <div className="flex items-center justify-between p-3 rounded bg-[#0A0E17]"><span className="text-sm text-white">Active session</span><span className="text-xs text-[#93CCFF]">{status?.active_session_id ? '1 SESSION' : 'NONE'}</span></div>
            <div className="flex items-center justify-between p-3 rounded bg-[#0A0E17]"><span className="text-sm text-white">Allowed actions</span><span className="text-xs text-[#4EDEA3]">{allowed}</span></div>
          </div>
        </section>
      </div>

      <section className="portal-card p-4">
        <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3"><div><p className="portal-label">DECISION FLIGHT RECORDER</p><h3 className="text-lg font-bold text-white mt-1">Recent Actions</h3></div><ShieldAlert className="w-5 h-5 text-[#93CCFF]" /></div>
        <div className="overflow-x-auto mt-3"><table className="w-full text-left text-xs"><thead className="text-[#89929B] uppercase font-mono text-[10px]"><tr><th className="py-2">Action</th><th>Target</th><th>Outcome</th><th>Risk</th><th>Time</th></tr></thead><tbody>{actions.map((action) => <tr key={action.id} className="border-t border-[#3F4850]/30"><td className="py-3 text-white font-mono">{action.action_type}</td><td className="text-[#BFC7D2] font-mono">{action.target_path || 'N/A'}</td><td className={action.outcome.includes('BLOCK') ? 'text-[#FFB4AB]' : 'text-[#4EDEA3]'}>{action.outcome}</td><td className="text-[#FFB95F]">{action.risk_score}</td><td className="text-[#89929B]">{new Date(action.created_at).toLocaleTimeString()}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
