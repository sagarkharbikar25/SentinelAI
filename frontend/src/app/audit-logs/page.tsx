 'use client';

import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { ActionLog, getRecentActions } from '@/lib/daemon';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try { setLogs(await getRecentActions()); setError(null); } catch { setError('Daemon offline. Start the Python service on port 8765.'); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">APPEND-ONLY FLIGHT RECORDER</p>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
            <FileText className="w-6 h-6 text-[#93CCFF]" /> Audit Log Viewer
          </h2>
          <p className="text-xs text-[#BFC7D2] mt-1">Live action decisions recorded by the Sentinel daemon.</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 rounded bg-[#262A34] border border-[#3F4850] text-xs text-[#DFE2F0] hover:border-[#93CCFF]"><RefreshCw className="w-3.5 h-3.5" /> REFRESH</button>
      </div>
      {error && <div className="portal-card p-3 text-sm text-[#FFB4AB]">{error}</div>}
      <div className="portal-card p-4 overflow-x-auto">
        <table className="w-full text-left text-xs"><thead className="portal-label"><tr><th className="py-2">Time</th><th>Action</th><th>Target</th><th>Verdict</th><th>Risk</th></tr></thead><tbody>
          {logs.map((log) => <tr key={log.id} className="border-t border-[#3F4850]/30"><td className="py-3 text-[#89929B]">{new Date(log.created_at).toLocaleString()}</td><td className="text-white font-mono">{log.action_type}</td><td className="text-[#BFC7D2] font-mono">{log.target_path || 'N/A'}</td><td className={log.outcome.includes('BLOCK') ? 'text-[#FFB4AB]' : 'text-[#4EDEA3]'}>{log.outcome}</td><td className="text-[#FFB95F]">{log.risk_score}</td></tr>)}
          {!logs.length && <tr><td colSpan={5} className="py-8 text-center text-[#89929B]">No daemon actions recorded.</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}
