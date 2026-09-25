'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  XCircle,
  Download,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  ActionLog,
  DaemonAlert,
  DaemonStatus,
  getAlerts,
  getDaemonStatus,
  getRecentActions,
  interceptAction,
  markAlertRead,
} from '@/lib/daemon';
import { formatLocalDateTime, formatLocalTime } from '@/lib/dateUtils';

export default function SecurityCenterPage() {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [alerts, setAlerts] = useState<DaemonAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testerResult, setTesterResult] = useState<string | null>(null);
  const [targetPath, setTargetPath] = useState('~/.ssh/id_rsa');
  const [operation, setOperation] = useState('READ');

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [daemonStatus, recentActions, unreadAlerts] = await Promise.all([
        getDaemonStatus().catch(() => null),
        getRecentActions(50).catch(() => []),
        getAlerts().catch(() => []),
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
    const timer = window.setInterval(refresh, 4000);
    return () => window.clearInterval(timer);
  }, []);

  async function dismissAlert(alertId: string) {
    try {
      await markAlertRead(alertId);
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }

  async function dismissAllAlerts() {
    for (const a of alerts) {
      await markAlertRead(a.id).catch(() => {});
    }
    setAlerts([]);
  }

  async function evaluateRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await interceptAction({
        agent_id: 'sentinel-request-tester',
        agent_type: 'SHELL',
        action_type: `FILE_${operation}`,
        operation: operation,
        target_path: targetPath,
        command: `security_tester ${operation} ${targetPath}`,
      });
      setTesterResult(
        `${result.decision} // RISK ${result.risk_score}/100 (${result.risk_category}) // ${result.reason_code}: ${result.explanation}`
      );
      await refresh();
    } catch {
      setTesterResult('Daemon unavailable. Start the Python service on port 8765.');
    }
  }

  const handleExportCSV = () => {
    if (!actions.length) return;
    const headers = ['Action Type', 'Target Path', 'Verdict', 'Risk Score', 'Timestamp'];
    const rows = actions.map((a) => [
      `"${a.action_type}"`,
      `"${(a.target_path || '').replace(/"/g, '""')}"`,
      `"${a.outcome}"`,
      a.risk_score,
      `"${a.created_at}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `security_center_feed_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const blocked = actions.filter((action) => action.outcome.includes('BLOCK')).length;
  const allowed = actions.filter((action) => action.outcome.includes('ALLOW')).length;
  const averageRisk = actions.length
    ? Math.round(actions.reduce((sum, action) => sum + action.risk_score, 0) / actions.length)
    : 0;

  return (
    <div className="space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">SYSTEM TELEMETRY // RUNTIME INTERCEPTOR</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1 tracking-wide">
            <Activity className="w-6 h-6 text-[#93CCFF]" /> Security Threat Center
          </h2>
          <p className="text-xs text-[#BFC7D2] mt-1 font-sans">
            Live policy enforcement, deterministic risk scoring, alert triage, and local daemon telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181B25] border border-[#3F4850] text-xs text-[#DFE2F0] hover:border-[#93CCFF] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> SYNC TELEMETRY
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 text-xs text-[#FFB4AB] border border-red-500/40 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Interactive Request Tester */}
      <form
        onSubmit={evaluateRequest}
        className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between pb-1">
          <span className="text-[11px] font-bold text-[#93CCFF] uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> LIVE REQUEST INTERCEPTION TESTER
          </span>
          <span className="text-[10px] text-[#4EDEA3]">FASTAPI PORT 8765 HOOK</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div>
            <label className="block text-[10px] text-[#89929B] uppercase mb-1">Target Path / Resource</label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              required
              className="w-full rounded-lg bg-[#141824] border border-[#3F4850]/60 px-3 py-2 text-xs text-white focus:border-[#93CCFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#89929B] uppercase mb-1">Operation</label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full rounded-lg bg-[#141824] border border-[#3F4850]/60 px-3 py-2 text-xs text-white focus:border-[#93CCFF] focus:outline-none"
            >
              <option value="DELETE">DELETE</option>
              <option value="READ">READ</option>
              <option value="WRITE">WRITE</option>
              <option value="EXECUTE">EXECUTE</option>
            </select>
          </div>

          <button
            className="px-4 py-2.5 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] font-bold text-xs transition shadow-md whitespace-nowrap"
            type="submit"
          >
            EVALUATE REQUEST
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] text-[#89929B] uppercase">Quick Presets:</span>
          <button
            type="button"
            onClick={() => {
              setTargetPath('sentinel_canary.env');
              setOperation('DELETE');
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-[#181B25] hover:bg-[#1E2330] text-[#FF5449] border border-red-500/30 transition"
          >
            🚨 Canary File Delete
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetPath('~/.ssh/id_rsa');
              setOperation('READ');
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-[#181B25] hover:bg-[#1E2330] text-[#FFB95F] border border-amber-500/30 transition"
          >
            🔑 SSH Key Read
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetPath('d:/GitHub/SentinelAI/workspace/sample.txt');
              setOperation('WRITE');
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-[#181B25] hover:bg-[#1E2330] text-[#4EDEA3] border border-emerald-500/30 transition"
          >
            ✅ Safe Workspace Write
          </button>
        </div>

        {testerResult && (
          <div className="mt-2 p-2.5 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-[#FFB95F] font-mono">
            {testerResult}
          </div>
        )}
      </form>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: 'DAEMON STATUS',
            value: status?.running ? 'ONLINE' : 'OFFLINE',
            color: status?.running ? 'text-[#4EDEA3]' : 'text-[#FFB4AB]',
            sub: `Circuit: ${status?.circuit_breaker_state ?? 'CLOSED'}`,
          },
          {
            label: 'RECENT ACTIONS',
            value: actions.length,
            color: 'text-[#93CCFF]',
            sub: 'Live SQLite ledger',
          },
          {
            label: 'BLOCKED ATTACKS',
            value: blocked,
            color: 'text-[#FFB4AB]',
            sub: 'Containment 100%',
          },
          {
            label: 'AVG RISK SCORE',
            value: averageRisk,
            color: averageRisk >= 70 ? 'text-[#FFB4AB]' : 'text-[#FFB95F]',
            sub: 'Heuristic engine index',
          },
        ].map((metric) => (
          <div key={metric.label} className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg">
            <p className="text-[10px] text-[#89929B] uppercase font-bold tracking-wider">{metric.label}</p>
            <p className={`text-2xl font-black mt-2 ${metric.color}`}>{metric.value}</p>
            <p className="text-[11px] text-[#89929B] mt-1">{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert Feed & Agent Health */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
        <section className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#3F4850]/40 pb-3">
            <div>
              <p className="text-[10px] text-[#89929B] uppercase font-bold tracking-wider">ALERT FEED</p>
              <h3 className="text-base font-bold text-white mt-0.5">Unread Security Events</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40 font-bold">
                {alerts.length} UNREAD
              </span>
              {alerts.length > 0 && (
                <button
                  onClick={dismissAllAlerts}
                  className="text-[10px] text-[#93CCFF] hover:underline"
                >
                  DISMISS ALL
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.length === 0 && (
              <p className="text-xs text-[#89929B] py-6 text-center">No unread alerts from the daemon.</p>
            )}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-[#141824] border border-[#3F4850]/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FFB95F]" />
                    <span className="text-[10px] font-bold text-[#FFB95F]">{alert.severity}</span>
                    <span className="text-[10px] text-[#89929B]">
                      {formatLocalDateTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="font-bold text-white leading-snug">{alert.title}</p>
                  <p className="text-[#BFC7D2] text-[11px] font-sans">{alert.description}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-[10px] text-[#93CCFF] hover:underline whitespace-nowrap self-start mt-1"
                >
                  MARK READ
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg xl:col-span-2 space-y-3">
          <p className="text-[10px] text-[#89929B] uppercase font-bold tracking-wider">AGENT HEALTH</p>
          <h3 className="text-base font-bold text-white mt-0.5">Runtime Protection</h3>
          <div className="space-y-2.5 mt-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#3F4850]/30">
              <span className="text-white">Policy Engine</span>
              <span className="flex items-center gap-1 text-[#4EDEA3] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#3F4850]/30">
              <span className="text-white">Active Session</span>
              <span className="text-[#93CCFF] font-bold">
                {status?.active_session_id ? status.active_session_id.slice(0, 10) + '...' : 'NONE'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#3F4850]/30">
              <span className="text-white">Allowed Actions</span>
              <span className="text-[#4EDEA3] font-bold">{allowed}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Decision Flight Recorder Feed */}
      <section className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#3F4850]/40 pb-3">
          <div>
            <p className="text-[10px] text-[#89929B] uppercase font-bold tracking-wider">DECISION FLIGHT RECORDER</p>
            <h3 className="text-base font-bold text-white mt-0.5">Recent Intercepted Operations</h3>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!actions.length}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 text-xs text-[#93CCFF] disabled:opacity-40 transition"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#89929B] uppercase text-[10px] border-b border-[#3F4850]/30">
              <tr>
                <th className="py-2">Action Type</th>
                <th>Target Resource</th>
                <th>Outcome</th>
                <th>Risk Score</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3F4850]/20">
              {actions.map((action) => (
                <tr key={action.id} className="hover:bg-[#141824]/60 transition">
                  <td className="py-2.5 text-white font-bold">{action.action_type}</td>
                  <td className="text-[#BFC7D2] max-w-[240px] truncate">{action.target_path || 'N/A'}</td>
                  <td className={action.outcome.includes('BLOCK') ? 'text-[#FFB4AB] font-bold' : 'text-[#4EDEA3] font-bold'}>
                    {action.outcome}
                  </td>
                  <td className="text-[#FFB95F] font-bold">{action.risk_score}</td>
                  <td className="text-[#89929B]">{formatLocalTime(action.created_at)}</td>
                </tr>
              ))}
              {!actions.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#89929B]">
                    No intercepted actions recorded yet. Use the tester above to trigger an action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
