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

      {/* Header with single-row action toolbar (F1: White Headings, F12: Collapsed Export) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isOnline ? 'bg-accent-emerald animate-pulse' : 'bg-accent-rose'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-accent-emerald' : 'text-accent-rose'
              }`}
            >
              Append-only flight recorder &bull; Cryptographic SHA-256 chain
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight text-balance">
            Audit Log Flight Recorder
          </h1>
          <p className="text-xs text-text-secondary text-pretty max-w-2xl">
            Tamper-evident audit ledger capturing every intercepted operation, permission evaluation, and policy verdict.
          </p>
        </div>

        {/* F12: Single-row action toolbar with Collapsed Export Dropdown */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={handleVerifyLog}
            disabled={verifying || !isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to verify log.' : undefined}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:opacity-90 text-canvas text-xs font-bold transition-opacity shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck className={`size-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify log</span>
          </button>

          <button
            onClick={refresh}
            disabled={!isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to refresh.' : undefined}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-medium text-text-primary transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`size-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerTestAction}
            disabled={isSimulating || !isOnline}
            title={!isOnline ? 'Daemon offline. Start local service on port 8765 to inject events.' : undefined}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-medium text-text-secondary transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Terminal className="size-3.5" />
            <span>Test event</span>
          </button>

          {/* F12: Collapsed Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!logs.length}
              title={!logs.length ? 'No log entries available to export.' : undefined}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-medium text-text-primary transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-3.5 text-text-muted" />
              <span>Export</span>
              <span className="text-[10px] opacity-75">▾</span>
            </button>

            {showExportDropdown && logs.length > 0 && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-card border border-border shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-card-hover text-text-primary transition-colors flex items-center justify-between"
                >
                  <span>Export as CSV</span>
                  <span className="text-[10px] font-mono text-text-muted">.csv</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-card-hover text-text-primary transition-colors flex items-center justify-between"
                >
                  <span>Export as JSON</span>
                  <span className="text-[10px] font-mono text-text-muted">.json</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cryptographic Proof Banner (F10: Live verification count) */}
      {verifyResult && (
        <div
          role="region"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono shadow-xs animate-in fade-in duration-150 ${
            verifyResult.valid
              ? 'bg-card border-accent-emerald/40 text-accent-emerald'
              : 'bg-card border-accent-rose/40 text-accent-rose'
          }`}
        >
          <div className="flex items-center gap-3">
            {verifyResult.valid ? (
              <ShieldCheck className="size-5 shrink-0 text-accent-emerald" />
            ) : (
              <ShieldAlert className="size-5 shrink-0 text-accent-rose" />
            )}
            <div>
              <p className="font-bold">
                {verifyResult.valid
                  ? `Cryptographic Integrity Verified: ${verifyResult.count} entries intact`
                  : 'Tamper Detected: Chain Corruption Found'}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">{verifyResult.message}</p>
            </div>
          </div>
          {verifyResult.head_hash && (
            <span className="text-[10px] text-text-muted font-mono">
              Head: {verifyResult.head_hash.slice(0, 16)}...
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-card border border-accent-rose/40 text-accent-rose text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="size-3.5 text-text-muted absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search action ID, agent, command, path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
          />
        </div>

        {/* Filter by Verdict */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-text-muted font-medium mr-1">Verdict:</span>
          {(['ALL', 'BLOCKED', 'ALLOWED', 'PROMPT'] as const).map((outcome) => (
            <button
              key={outcome}
              onClick={() => setFilterOutcome(outcome)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterOutcome === outcome
                  ? 'bg-surface text-accent font-semibold border border-accent/30 shadow-xs'
                  : 'bg-surface/50 text-text-secondary hover:text-text-primary'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>

        {/* Filter by Severity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-text-muted font-medium mr-1">Risk:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-surface text-accent font-semibold border border-accent/30 shadow-xs'
                  : 'bg-surface/50 text-text-secondary hover:text-text-primary'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface text-text-muted border-b border-border uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Agent</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Resource</th>
                <th className="py-3 px-4 font-semibold text-center">Risk</th>
                <th className="py-3 px-4 font-semibold text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
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
                      className="hover:bg-card-hover transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-text-muted tabular-nums whitespace-nowrap">
                        {formatLocalTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                        {log.agent_id || 'system'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] text-text-secondary">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-xs truncate" title={log.target_path || undefined}>
                        {log.target_path || 'None'}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            log.risk_score >= 80
                              ? 'bg-accent-rose/15 text-accent-rose font-bold'
                              : log.risk_score >= 50
                              ? 'bg-accent-amber/15 text-accent-amber font-bold'
                              : 'bg-accent-emerald/15 text-accent-emerald'
                          }`}
                        >
                          {log.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] ${
                            isBlock
                              ? 'bg-accent-rose/15 text-accent-rose border border-accent-rose/30'
                              : isPrompt
                              ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
                              : 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-heading font-bold text-sm text-text-primary">Audit Event Detail</span>
              <button
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
                className="size-7 rounded-lg bg-surface hover:bg-card-hover text-text-secondary flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Action ID:</span>
                <span className="text-text-primary font-semibold">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Agent:</span>
                <span className="text-accent font-bold">{selectedLog.agent_id || 'system'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Operation:</span>
                <span className="text-text-primary font-semibold">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Target:</span>
                <span className="text-text-secondary truncate max-w-xs">{selectedLog.target_path}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Verdict:</span>
                <span className="font-bold text-accent-emerald">{selectedLog.outcome}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Risk Score:</span>
                <span className="font-bold text-accent-amber tabular-nums">{selectedLog.risk_score}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
