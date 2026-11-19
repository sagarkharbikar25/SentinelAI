'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Terminal,
  X,
} from 'lucide-react';
import { ActionLog, getRecentActions, interceptAction, verifyLog, VerifyLogResult } from '@/lib/daemon';
import { formatLocalTime } from '@/lib/dateUtils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyLogResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyLog = async () => {
    setVerifying(true);
    try {
      const res = await verifyLog();
      setVerifyResult(res);
    } finally {
      setVerifying(false);
    }
  };

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2EAE4] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-[#059669]">
              Append-only flight recorder &bull; Chained SHA-256
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#111915] tracking-tight text-balance">
            Audit Log Flight Recorder
          </h1>
          <p className="text-xs text-[#536459] text-pretty max-w-2xl">
            Tamper-evident audit ledger capturing every intercepted operation, permission evaluation, and policy verdict.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyLog}
            disabled={verifying}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className={`size-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify cryptographic log</span>
          </button>

          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#111915] transition-colors shadow-xs"
          >
            <RefreshCw className={`size-3.5 text-[#059669] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerTestAction}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#536459] transition-colors shadow-xs disabled:opacity-50"
          >
            <Terminal className="size-3.5" />
            <span>Test event</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!logs.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#536459] transition-colors disabled:opacity-50"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={!logs.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#536459] transition-colors disabled:opacity-50"
          >
            <Download className="size-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Proof Banner */}
      {verifyResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono shadow-xs animate-in fade-in duration-150 ${
            verifyResult.valid
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {verifyResult.valid ? (
              <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
            ) : (
              <ShieldAlert className="size-5 shrink-0 text-red-600" />
            )}
            <div>
              <p className="font-bold">
                {verifyResult.valid ? 'Cryptographic Integrity: Verified' : 'Tamper Detected: Chain Corruption Found'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">{verifyResult.message}</p>
            </div>
          </div>
          {verifyResult.head_hash && (
            <span className="text-[10px] opacity-75 font-mono">
              Head: {verifyResult.head_hash.slice(0, 16)}...
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-red-800 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="size-3.5 text-[#75887B] absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search action ID, agent, command, path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9FAF9] border border-[#E2EAE4] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-[#111915] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        {/* Filter by Verdict */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#75887B] font-medium mr-1">Verdict:</span>
          {(['ALL', 'BLOCKED', 'ALLOWED', 'PROMPT'] as const).map((outcome) => (
            <button
              key={outcome}
              onClick={() => setFilterOutcome(outcome)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterOutcome === outcome
                  ? 'bg-[#EAF5EE] text-[#166534] font-semibold border border-[#BBF7D0]'
                  : 'bg-[#F4F7F5] text-[#536459] hover:bg-[#EAF0EB]'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>

        {/* Filter by Severity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#75887B] font-medium mr-1">Risk:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-[#EAF5EE] text-[#166534] font-semibold border border-[#BBF7D0]'
                  : 'bg-[#F4F7F5] text-[#536459] hover:bg-[#EAF0EB]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F9FAF9] text-[#75887B] border-b border-[#E2EAE4] uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Agent</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Resource</th>
                <th className="py-3 px-4 font-semibold text-center">Risk</th>
                <th className="py-3 px-4 font-semibold text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F6F3]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#75887B]">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isBlock = log.outcome?.includes('BLOCK');
                  const isPrompt = log.outcome?.includes('PROMPT') || log.outcome?.includes('USER');

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#F9FAF9] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-[#75887B] tabular-nums whitespace-nowrap">
                        {formatLocalTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111915] whitespace-nowrap">
                        {log.agent_id || 'system'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#F4F7F5] border border-[#E2EAE4] text-[10px] text-[#536459]">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#536459] max-w-xs truncate" title={log.target_path || undefined}>
                        {log.target_path || 'None'}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            log.risk_score >= 80
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : log.risk_score >= 50
                              ? 'bg-amber-50 text-amber-800 font-bold'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {log.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] ${
                            isBlock
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isPrompt
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide-over / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 select-none">
          <div className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-2xl p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2EAE4] pb-3">
              <span className="font-heading font-bold text-sm text-[#111915]">Audit Event Detail</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="size-7 rounded-lg bg-[#F4F7F5] hover:bg-[#EAF0EB] text-[#536459] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-[#F2F6F3]">
                <span className="text-[#75887B]">Action ID:</span>
                <span className="text-[#111915] font-semibold">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F6F3]">
                <span className="text-[#75887B]">Agent:</span>
                <span className="text-[#059669] font-bold">{selectedLog.agent_id || 'system'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F6F3]">
                <span className="text-[#75887B]">Operation:</span>
                <span className="text-[#111915] font-semibold">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F6F3]">
                <span className="text-[#75887B]">Target:</span>
                <span className="text-[#536459] truncate max-w-xs">{selectedLog.target_path}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F6F3]">
                <span className="text-[#75887B]">Verdict:</span>
                <span className="font-bold text-emerald-700">{selectedLog.outcome}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#75887B]">Risk Score:</span>
                <span className="font-bold text-amber-700 tabular-nums">{selectedLog.risk_score}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
