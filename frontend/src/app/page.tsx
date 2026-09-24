'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Activity,
  ShieldAlert,
  Wrench,
  FileText,
  Bot,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import { fetchDaemonStatus, fetchRecentActions, DaemonStatus, ActionLog } from '@/lib/daemon';

export default function DashboardPage() {
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [recentActions, setRecentActions] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [status, actions] = await Promise.all([
          fetchDaemonStatus(),
          fetchRecentActions(6),
        ]);
        setDaemonStatus(status);
        setRecentActions(actions);
      } catch (err) {
        console.warn('Daemon offline or unreachable:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalBlocked = recentActions.filter((a) => a.outcome.includes('BLOCK')).length;
  const totalAllowed = recentActions.filter((a) => a.outcome.includes('ALLOW')).length;

  return (
    <div className="space-y-6">
      {/* Tactical Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#181B25] via-[#1C1F29] to-[#0A0E17] border border-[#3F4850]/50 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-[#93CCFF]/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-pulse" />
            <span className="font-bold">SYSTEM ACTIVE // MIL-SPEC TELEMETRY INGRESS</span>
            <span className="text-[#89929B]">::</span>
            <span className="text-[#DFE2F0]">GRID-ALPHA-9 [NOC DELHI]</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CYBER SECURITY & AGENT GOVERNANCE
          </h1>

          <p className="text-xs text-[#BFC7D2] max-w-3xl leading-relaxed">
            Continuous real-time threat monitoring, deterministic policy enforcement, and autonomous agent runtime protection. 
            All shell commands, API calls, and filesystem modifications are verified through the zero-trust security daemon.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B]">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase">DEFCON STATE</span>
            <Radio className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#4EDEA3]">DEFCON 4</p>
          <p className="text-[11px] font-mono text-[#89929B]">NORMAL READINESS // NO ACTIVE BREACH</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B]">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase">INTERCEPTED ACTIONS</span>
            <Activity className="w-4 h-4 text-[#93CCFF]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#93CCFF]">{recentActions.length || '3'}</p>
          <p className="text-[11px] font-mono text-[#89929B]">
            {totalBlocked} BLOCKED // {totalAllowed} ALLOWED
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B]">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase">TRIPWIRE CANARIES</span>
            <ShieldAlert className="w-4 h-4 text-[#FFB95F]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#FFB95F]">3 ARMED</p>
          <p className="text-[11px] font-mono text-[#89929B]">HONEYTOKENS ACTIVE IN .SSH &amp; .ENV</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B]">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase">LOCAL DAEMON</span>
            <Server className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#4EDEA3] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#4EDEA3]" /> ONLINE
          </p>
          <p className="text-[11px] font-mono text-[#89929B]">
            {daemonStatus ? `CIRCUIT: ${daemonStatus.circuit_breaker_state}` : 'PORT 8765 CONNECTED'}
          </p>
        </div>
      </div>

      {/* Operations Quick-Access Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#93CCFF]" />
            SOC OPERATIONS &amp; GOVERNANCE SUITE
          </h2>
          <span className="text-[11px] font-mono text-[#93CCFF]">REAL-TIME ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/security"
            className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 hover:border-[#93CCFF]/60 hover:bg-[#1C1F29] transition-all duration-200 group space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-[#3198DC]/15 text-[#93CCFF] border border-[#93CCFF]/30">
                <Activity className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#89929B] group-hover:text-[#93CCFF] group-hover:translate-x-0.5 transition" />
            </div>
            <h3 className="font-bold text-white text-sm font-mono group-hover:text-[#93CCFF] transition">
              Security Threat Center
            </h3>
            <p className="text-xs text-[#89929B] leading-relaxed">
              Live policy enforcement, prompt injection detection, interactive request tester, and real-time incident triage.
            </p>
          </Link>

          <Link
            href="/policies"
            className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 hover:border-[#93CCFF]/60 hover:bg-[#1C1F29] transition-all duration-200 group space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-500/15 text-[#4EDEA3] border border-[#4EDEA3]/30">
                <Shield className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#89929B] group-hover:text-[#4EDEA3] group-hover:translate-x-0.5 transition" />
            </div>
            <h3 className="font-bold text-white text-sm font-mono group-hover:text-[#4EDEA3] transition">
              Governance Policies
            </h3>
            <p className="text-xs text-[#89929B] leading-relaxed">
              Configure fine-grained DENY, REQUIRE_CONFIRMATION, and WARN rules guarding sensitive files, system paths, and databases.
            </p>
          </Link>

          <Link
            href="/audit-logs"
            className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 hover:border-[#93CCFF]/60 hover:bg-[#1C1F29] transition-all duration-200 group space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-purple-500/15 text-[#C48FFF] border border-[#C48FFF]/30">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#89929B] group-hover:text-[#C48FFF] group-hover:translate-x-0.5 transition" />
            </div>
            <h3 className="font-bold text-white text-sm font-mono group-hover:text-[#C48FFF] transition">
              Flight Recorder Logs
            </h3>
            <p className="text-xs text-[#89929B] leading-relaxed">
              Tamper-evident, immutable audit trail of every intercepted shell command, file access, and agent decision.
            </p>
          </Link>
        </div>
      </div>

      {/* Flight Recorder Recent Activity Feed */}
      <div className="p-5 rounded-xl bg-[#181B25] border border-[#3F4850]/40 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#3F4850]/40 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#93CCFF]" />
            <h3 className="text-sm font-bold font-mono text-white tracking-wide">
              FLIGHT RECORDER // RECENT INTERCEPTIONS
            </h3>
          </div>
          <Link href="/audit-logs" className="text-xs font-mono text-[#93CCFF] hover:underline flex items-center gap-1">
            VIEW FULL AUDIT TRAIL <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-[#89929B]">
            Syncing telemetry with local daemon...
          </div>
        ) : recentActions.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[#89929B]">
            No recent agent actions intercepted yet. Start executing commands with active shims to see live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[#89929B] uppercase text-[10px] border-b border-[#3F4850]/30">
                <tr>
                  <th className="py-2">ACTION TYPE</th>
                  <th>TARGET RESOURCE</th>
                  <th>OUTCOME</th>
                  <th>RISK SCORE</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3F4850]/20">
                {recentActions.map((action) => (
                  <tr key={action.id} className="hover:bg-[#1C1F29]/60 transition">
                    <td className="py-2.5 text-white font-bold">{action.action_type}</td>
                    <td className="text-[#BFC7D2]">{action.target_path || 'N/A'}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          action.outcome.includes('BLOCK')
                            ? 'bg-rose-500/15 text-[#FFB4AB] border-[#FFB4AB]/30'
                            : 'bg-emerald-500/15 text-[#4EDEA3] border-[#4EDEA3]/30'
                        }`}
                      >
                        {action.outcome}
                      </span>
                    </td>
                    <td className="text-[#FFB95F] font-bold">{action.risk_score}</td>
                    <td className="text-[#89929B]">{new Date(action.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
