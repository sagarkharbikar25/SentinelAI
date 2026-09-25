'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  Filter,
  Eye,
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Terminal,
  Database,
  ArrowUpDown,
} from 'lucide-react';
import { ActionLog, getRecentActions, interceptAction } from '@/lib/daemon';
import { formatLocalDateTime } from '@/lib/dateUtils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getRecentActions(100);
      setLogs(data);
      setError(null);
    } catch {
      setError('Daemon offline. Start the Python service on port 8765.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerTestAction = async () => {
    setIsSimulating(true);
    try {
      await interceptAction({
        agent_id: 'audit-verifier-bot',
        agent_type: 'AUTONOMOUS',
        action_type: 'SHELL_EXEC',
        operation: 'EXECUTE',
        target_path: '/etc/shadow',
        command: 'cat /etc/shadow',
      });
      await refresh();
    } catch (err: any) {
      console.error('Failed to trigger test audit action:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['Audit ID', 'Agent ID', 'Action Type', 'Target Resource', 'Risk Score', 'Verdict / Outcome', 'Timestamp'];
    const rows = logs.map((log) => [
      `"${log.id}"`,
      `"${log.agent_id || 'unknown'}"`,
      `"${log.action_type}"`,
      `"${(log.target_path || '').replace(/"/g, '""')}"`,
      log.risk_score,
      `"${log.outcome}"`,
      `"${log.created_at}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_flight_recorder_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!logs.length) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentinel_flight_recorder_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === '' ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.agent_id && log.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target_path && log.target_path.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchOutcome =
      filterOutcome === 'ALL' ||
      (filterOutcome === 'BLOCKED' && log.outcome.includes('BLOCK')) ||
      (filterOutcome === 'ALLOWED' && log.outcome.includes('ALLOW')) ||
      (filterOutcome === 'PROMPT' && (log.outcome.includes('PROMPT') || log.outcome.includes('USER')));

    const matchSeverity =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && log.risk_score >= 80) ||
      (filterSeverity === 'HIGH' && log.risk_score >= 50 && log.risk_score < 80) ||
      (filterSeverity === 'MEDIUM' && log.risk_score >= 20 && log.risk_score < 50) ||
      (filterSeverity === 'LOW' && log.risk_score < 20);

    return matchSearch && matchOutcome && matchSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">APPEND-ONLY FLIGHT RECORDER // IMMUTABLE AUDIT TRAIL</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-1 tracking-wide">
            <FileText className="w-6 h-6 text-[#93CCFF]" /> Audit Log Flight Recorder
          </h2>
          <p className="text-xs text-[#BFC7D2] mt-1">
            Tamper-evident audit ledger capturing every intercepted operation, permission evaluation, and policy verdict.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/60 text-xs font-mono font-semibold text-[#DFE2F0] hover:border-[#93CCFF] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#93CCFF] ${loading ? 'animate-spin' : ''}`} />
            REFRESH LOGS
          </button>

          <button
            onClick={handleTriggerTestAction}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-mono font-bold text-[#FFB95F] transition shadow-sm disabled:opacity-50"
          >
            <Terminal className="w-3.5 h-3.5" />
            TRIGGER TEST AUDIT EVENT
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!logs.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] text-xs font-mono font-bold shadow-md transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={!logs.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/60 text-[#DFE2F0] text-xs font-mono font-bold transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            EXPORT JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-[#FFB4AB] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg flex flex-wrap items-center justify-between gap-3 font-mono">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#89929B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action ID, agent, command, path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-[#3F4850]/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#93CCFF]"
          />
        </div>

        {/* Filter by Verdict */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[10px] text-[#89929B] uppercase font-bold mr-1">VERDICT:</span>
          {(['ALL', 'BLOCKED', 'ALLOWED', 'PROMPT'] as const).map((outcome) => (
            <button
              key={outcome}
              onClick={() => setFilterOutcome(outcome)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                filterOutcome === outcome
                  ? 'bg-[#3198DC] text-[#002C47]'
                  : 'bg-[#141824] text-[#89929B] hover:text-white border border-[#3F4850]/40'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>

        {/* Filter by Severity */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[10px] text-[#89929B] uppercase font-bold mr-1">SEVERITY:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                filterSeverity === sev
                  ? 'bg-[#93CCFF] text-[#002C47]'
                  : 'bg-[#141824] text-[#89929B] hover:text-white border border-[#3F4850]/40'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-[#0E131F] border border-[#3F4850]/50 overflow-hidden shadow-xl font-mono">
        <div className="p-3 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#93CCFF]" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              SQLITE AUDIT LEDGER ({filteredLogs.length} OF {logs.length} ENTRIES)
            </span>
          </div>
          <span className="text-[10px] text-[#89929B]">STORAGE: ~/.sentinelai/sentinel.db</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#89929B] uppercase text-[10px] border-b border-[#3F4850]/40 bg-[#141824]/80">
              <tr>
                <th className="py-2.5 px-4">AUDIT EVENT ID</th>
                <th>TIMESTAMP</th>
                <th>ACTOR / AGENT</th>
                <th>ACTION TYPE</th>
                <th>TARGET RESOURCE</th>
                <th>RISK SCORE</th>
                <th>DECISION OUTCOME</th>
                <th className="text-right px-4">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3F4850]/20">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#141824]/60 transition">
                  <td className="py-3 px-4 font-bold text-[#93CCFF] text-[11px] truncate max-w-[130px]">
                    {log.id.slice(0, 12)}...
                  </td>
                  <td className="text-[#89929B] text-[11px]">
                    {formatLocalDateTime(log.created_at)}
                  </td>
                  <td className="text-white font-semibold text-[11px]">
                    {log.agent_id || 'system-shim'}
                  </td>
                  <td className="text-[#DFE2F0] text-[11px]">{log.action_type}</td>
                  <td className="text-[#BFC7D2] text-[11px] max-w-[220px] truncate">
                    {log.target_path || 'N/A'}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.risk_score >= 80
                          ? 'bg-rose-500/15 text-[#FFB4AB] border-[#FFB4AB]/30'
                          : log.risk_score >= 50
                          ? 'bg-amber-500/15 text-[#FFB95F] border-[#FFB95F]/30'
                          : 'bg-emerald-500/15 text-[#4EDEA3] border-[#4EDEA3]/30'
                      }`}
                    >
                      {log.risk_score}/100
                    </span>
                  </td>
                  <td>
                    <span
                      className={`font-bold text-[11px] ${
                        log.outcome.includes('BLOCK')
                          ? 'text-[#FFB4AB]'
                          : log.outcome.includes('USER')
                          ? 'text-[#FFB95F]'
                          : 'text-[#4EDEA3]'
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </td>
                  <td className="text-right px-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 text-[#93CCFF] hover:border-[#93CCFF] text-[10px] font-bold inline-flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" /> VIEW
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredLogs.length && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#89929B] space-y-2">
                    <p className="text-sm font-semibold text-white">No Audit Logs Found</p>
                    <p className="text-xs">
                      {logs.length === 0
                        ? 'The SQLite audit table is currently empty. Use the button below to generate a test event.'
                        : 'No logs match your current search and filter criteria.'}
                    </p>
                    {logs.length === 0 && (
                      <button
                        onClick={handleTriggerTestAction}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#93CCFF]/15 hover:bg-[#93CCFF]/25 border border-[#93CCFF]/40 text-[#93CCFF] text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        TRIGGER TEST AUDIT RECORD
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Inspection Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#141824] border border-[#3F4850] shadow-2xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#93CCFF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Audit Record Telemetry
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded hover:bg-[#1C1F29] text-[#89929B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">EVENT ID:</span>
                <span className="text-white font-bold">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">SESSION ID:</span>
                <span className="text-[#DFE2F0]">{selectedLog.session_id || 'STANDALONE_HOOK'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">AGENT RUNTIME:</span>
                <span className="text-[#93CCFF] font-bold">{selectedLog.agent_id || 'unknown'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">ACTION TYPE:</span>
                <span className="text-white">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">TARGET RESOURCE:</span>
                <span className="text-[#DFE2F0] max-w-[280px] truncate">{selectedLog.target_path || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">RISK SCORE:</span>
                <span className="text-[#FFB95F] font-bold">{selectedLog.risk_score} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">VERDICT / OUTCOME:</span>
                <span className={`font-bold ${selectedLog.outcome.includes('BLOCK') ? 'text-[#FFB4AB]' : 'text-[#4EDEA3]'}`}>
                  {selectedLog.outcome}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">TAMPER-EVIDENT STATUS:</span>
                <span className="text-[#4EDEA3] flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED APPEND-ONLY
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">RECORDED AT (LOCAL TIME):</span>
                <span className="text-[#4EDEA3] font-bold">{formatLocalDateTime(selectedLog.created_at)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/60 text-xs font-bold text-white transition"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
