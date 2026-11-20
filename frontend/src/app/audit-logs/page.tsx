'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { ActionLog, getRecentActions, interceptAction, verifyLog, VerifyLogResult } from '@/lib/daemon';
import { useDaemon } from '@/context/DaemonContext';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { formatLocalTime } from '@/lib/dateUtils';

export default function AuditLogsPage() {
  const { status } = useDaemon();
  const isOnline = status === 'online';

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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleVerifyLog = async () => {
    if (!isOnline) return;
    setVerifying(true);
    try {
      const res = await verifyLog();
      setVerifyResult(res);
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  async function refresh() {
    if (!isOnline) {
      setLoading(false);
      return;
    }
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
  }, [isOnline]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerTestAction = async () => {
    if (!isOnline) return;
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
    setShowExportDropdown(false);
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
    setShowExportDropdown(false);
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
      <OfflineBanner />

      {/* Header with single-row action toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-pill ${
                isOnline ? 'bg-safe animate-pulse' : 'bg-critical'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-safe-ink' : 'text-critical-ink'
              }`}
            >
              Append-only flight recorder &bull; Cryptographic SHA-256 chain
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-ink-1 tracking-tight text-balance">
            Audit Log Flight Recorder
          </h1>
          <p className="text-xs text-ink-2 text-pretty max-w-2xl">
            Tamper-evident audit ledger capturing every intercepted operation, permission evaluation, and policy verdict.
          </p>
        </div>

        {/* Single-row action toolbar with Collapsed Export Dropdown (Pill radius) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={handleVerifyLog}
            disabled={verifying || !isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to verify log.' : undefined}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck className={`size-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify log</span>
          </button>

          <button
            onClick={refresh}
            disabled={!isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to refresh.' : undefined}
            className="flex items-center gap-2 px-4 py-2 rounded-pill bg-surface hover:bg-well border border-line text-xs font-medium text-ink-1 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`size-3.5 text-brand ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerTestAction}
            disabled={isSimulating || !isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to inject events.' : undefined}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-surface hover:bg-well border border-line text-xs font-medium text-ink-2 hover:text-ink-1 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Terminal className="size-3.5" />
            <span>Test event</span>
          </button>

          {/* Collapsed Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!logs.length}
              title={!logs.length ? 'No log entries available to export.' : undefined}
              className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-surface hover:bg-well border border-line text-xs font-medium text-ink-1 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-3.5 text-ink-3" />
              <span>Export</span>
              <span className="text-[10px] opacity-75">▾</span>
            </button>

            {showExportDropdown && logs.length > 0 && (
              <div className="absolute right-0 mt-2 w-44 rounded-card bg-surface border border-line shadow-card p-2 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 rounded-well hover:bg-well text-ink-1 transition-colors flex items-center justify-between"
                >
                  <span>Export as CSV</span>
                  <span className="text-[10px] font-mono text-ink-3">.csv</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 rounded-well hover:bg-well text-ink-1 transition-colors flex items-center justify-between"
                >
                  <span>Export as JSON</span>
                  <span className="text-[10px] font-mono text-ink-3">.json</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXACTLY ONCE on Audit: Hash-chain ribbon backdrop with --gradient-sky */}
      <div className="p-5 rounded-card bg-gradient-sky shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#071E33]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-pill bg-surface/90 text-brand-ink shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase font-bold text-[#071E33]/80 tracking-wider">
                Cryptographic Merkle Ledger
              </span>
              <span className="px-2 py-0.5 rounded-pill bg-lime text-ink-1 text-[9px] font-bold font-mono">
                SHA-256
              </span>
            </div>
            <p className="font-display font-bold text-lg text-[#071E33] leading-snug">
              {verifyResult
                ? verifyResult.valid
                  ? `Integrity Verified: ${verifyResult.count} entries mathematically confirmed`
                  : 'Tamper Detected: Chain Corruption Found'
                : `Active Ledger: ${logs.length} sequential operations linked by hash`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {verifyResult?.head_hash && (
            <span className="text-[11px] font-mono px-3 py-1.5 rounded-pill bg-surface/90 text-ink-1 border border-line shadow-xs">
              Head: {verifyResult.head_hash.slice(0, 16)}...
            </span>
          )}
          <span className="px-3.5 py-1.5 rounded-pill bg-surface/90 text-safe-ink font-mono font-bold text-xs shadow-xs border border-line">
            {verifyResult?.valid ? 'CHAIN VERIFIED' : isOnline ? 'DAEMON READY' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-well bg-critical-soft text-critical-ink text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Search & Filters (Wells, pill radius) */}
      <div className="p-4 rounded-card bg-surface shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="size-3.5 text-ink-3 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search action ID, agent, command, path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-well border border-line rounded-pill pl-10 pr-4 py-2 text-xs text-ink-1 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all"
          />
        </div>

        {/* Filter by Verdict */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-ink-3 font-medium mr-1">Verdict:</span>
          {(['ALL', 'BLOCKED', 'ALLOWED', 'PROMPT'] as const).map((outcome) => (
            <button
              key={outcome}
              onClick={() => setFilterOutcome(outcome)}
              className={`px-3 py-1 rounded-pill text-xs font-medium transition-all ${
                filterOutcome === outcome
                  ? 'bg-brand-soft text-brand-ink font-semibold'
                  : 'bg-well text-ink-2 hover:text-ink-1'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>

        {/* Filter by Severity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-ink-3 font-medium mr-1">Risk:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-pill text-xs font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-brand-soft text-brand-ink font-semibold'
                  : 'bg-well text-ink-2 hover:text-ink-1'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container (1px line border, 20px radius, shadow-card) */}
      <div className="rounded-card bg-surface border border-line shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-well text-ink-3 border-b border-line uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Agent</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Resource</th>
                <th className="py-3 px-4 font-semibold text-center">Risk</th>
                <th className="py-3 px-4 font-semibold text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-3">
                    {isOnline ? 'No audit records match the current filter criteria.' : 'Daemon offline. No actions to display.'}
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
                      className="hover:bg-well/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-ink-3 tabular-nums whitespace-nowrap">
                        {formatLocalTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-medium text-ink-1 whitespace-nowrap">
                        {log.agent_id || 'system'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-pill bg-well text-[10px] text-ink-2">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink-2 max-w-xs truncate" title={log.target_path || undefined}>
                        {log.target_path || 'None'}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        <span
                          className={`px-2.5 py-0.5 rounded-pill text-[10px] font-mono ${
                            log.risk_score >= 80
                              ? 'bg-critical-soft text-critical-ink font-bold'
                              : log.risk_score >= 50
                              ? 'bg-high-soft text-high-ink font-bold'
                              : 'bg-safe-soft text-safe-ink font-medium'
                          }`}
                        >
                          {log.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-pill text-[10px] font-mono ${
                            isBlock
                              ? 'bg-critical-soft text-critical-ink'
                              : isPrompt
                              ? 'bg-caution-soft text-caution-ink'
                              : 'bg-safe-soft text-safe-ink'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
          <div className="w-full max-w-lg rounded-card bg-surface border border-line shadow-card p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-display font-bold text-base text-ink-1">Audit Event Detail</span>
              <button
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
                className="size-7 rounded-pill bg-well hover:bg-well/80 text-ink-2 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-line">
                <span className="text-ink-3">Action ID:</span>
                <span className="text-ink-1 font-semibold">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line">
                <span className="text-ink-3">Agent:</span>
                <span className="text-brand-ink font-bold">{selectedLog.agent_id || 'system'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line">
                <span className="text-ink-3">Operation:</span>
                <span className="text-ink-1 font-semibold">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line">
                <span className="text-ink-3">Target:</span>
                <span className="text-ink-2 truncate max-w-xs">{selectedLog.target_path}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line">
                <span className="text-ink-3">Verdict:</span>
                <span className="font-bold text-safe-ink">{selectedLog.outcome}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ink-3">Risk Score:</span>
                <span className="font-bold text-caution-ink tabular-nums">{selectedLog.risk_score}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
