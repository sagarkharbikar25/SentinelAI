'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  Terminal,
  RefreshCw,
  Cpu,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  FileCode,
  Sliders,
  Send,
  Plus,
  Download,
  X,
  Ban,
} from 'lucide-react';
import {
  getDaemonStatus,
  getRecentActions,
  interceptAction,
  startSession,
  endSession,
  DaemonStatus,
  ActionLog,
} from '@/lib/daemon';
import { formatLocalTime } from '@/lib/dateUtils';

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'SUPERVISED' | 'RESTRICTED' | 'QUARANTINED';
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  grantedScopes: string[];
  tools: string[];
  lastActive: string;
}

const defaultAgents: AgentInfo[] = [
  {
    id: 'agent-autogpt-core',
    name: 'AutoGPT Autonomous Core',
    type: 'AUTONOMOUS',
    status: 'ACTIVE',
    riskScore: 24,
    riskCategory: 'LOW',
    grantedScopes: ['d:/GitHub/SentinelAI/workspace', 'd:/GitHub/SentinelAI/data'],
    tools: ['file_write', 'web_search', 'api_caller'],
    lastActive: 'Just now',
  },
  {
    id: 'agent-claude-engineer',
    name: 'Claude Engineer Shim',
    type: 'REASONING',
    status: 'SUPERVISED',
    riskScore: 18,
    riskCategory: 'LOW',
    grantedScopes: ['d:/GitHub/SentinelAI/src', 'd:/GitHub/SentinelAI/daemon'],
    tools: ['git_commit', 'file_edit', 'lint_runner'],
    lastActive: '1 min ago',
  },
  {
    id: 'agent-shell-executor',
    name: 'System Shell Shim',
    type: 'SYSTEM_SHELL',
    status: 'RESTRICTED',
    riskScore: 82,
    riskCategory: 'HIGH',
    grantedScopes: ['d:/GitHub/SentinelAI/tmp'],
    tools: ['powershell', 'bash_exec', 'pip_install'],
    lastActive: '3 mins ago',
  },
  {
    id: 'agent-langchain-worker',
    name: 'LangChain Retrieval Bot',
    type: 'DATA_RETRIEVAL',
    status: 'ACTIVE',
    riskScore: 35,
    riskCategory: 'LOW',
    grantedScopes: ['d:/GitHub/SentinelAI/docs', 'd:/GitHub/SentinelAI/manifests'],
    tools: ['vector_search', 'pdf_reader', 'db_query'],
    lastActive: '5 mins ago',
  },
];

export default function AgentsPage() {
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [recentActions, setRecentActions] = useState<ActionLog[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>(defaultAgents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Interceptor Simulator State
  const [simAgent, setSimAgent] = useState('agent-autogpt-core');
  const [simActionType, setSimActionType] = useState('FILE_WRITE');
  const [simOperation, setSimOperation] = useState('WRITE');
  const [simTargetPath, setSimTargetPath] = useState('sentinel_canary.env');
  const [simCommand, setSimCommand] = useState('echo "SECRET_LEAK" > sentinel_canary.env');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    decision: string;
    explanation: string;
    risk_score: number;
    risk_category: string;
    reason_code: string;
  } | null>(null);

  // New session state
  const [startingSession, setStartingSession] = useState(false);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState<string | null>(null);

  // Register Agent Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [newAgentType, setNewAgentType] = useState('AUTONOMOUS');
  const [newAgentScopes, setNewAgentScopes] = useState('d:/GitHub/SentinelAI/workspace');
  const [newAgentTools, setNewAgentTools] = useState('file_read, file_write');

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, actions] = await Promise.all([
        getDaemonStatus().catch(() => null),
        getRecentActions(30).catch(() => []),
      ]);
      setDaemonStatus(status);
      setRecentActions(actions);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Sentinel daemon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateIntercept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await interceptAction({
        agent_id: simAgent,
        agent_type: simAgent.includes('shell') ? 'SHELL' : 'AUTONOMOUS',
        action_type: simActionType,
        operation: simOperation,
        target_path: simTargetPath,
        command: simCommand,
      });
      setSimResult(res);
      await refreshData();
    } catch (err: any) {
      setSimResult({
        decision: 'DAEMON_ERROR',
        explanation: err?.message || 'Could not communicate with Python daemon at 127.0.0.1:8765.',
        risk_score: 100,
        risk_category: 'CRITICAL',
        reason_code: 'DAEMON_UNREACHABLE',
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleStartSession = async (agentId: string) => {
    setStartingSession(true);
    try {
      const res = await startSession({
        agent_id: agentId,
        task_description: `Supervised execution for ${agentId}`,
        granted_paths: ['d:/GitHub/SentinelAI/workspace', 'd:/GitHub/SentinelAI/src'],
      });
      setSessionSuccessMsg(`Session started: ${res.session_id.slice(0, 8)}... for ${agentId}`);
      setTimeout(() => setSessionSuccessMsg(null), 4000);
      await refreshData();
    } catch (err: any) {
      setError(`Failed to start session: ${err?.message}`);
    } finally {
      setStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (!daemonStatus?.active_session_id) return;
    try {
      await endSession(daemonStatus.active_session_id);
      setSessionSuccessMsg('Active session terminated successfully.');
      setTimeout(() => setSessionSuccessMsg(null), 4000);
      await refreshData();
    } catch (err: any) {
      setError(`Failed to end session: ${err?.message}`);
    }
  };

  const handleToggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextStatus =
            a.status === 'ACTIVE'
              ? 'SUPERVISED'
              : a.status === 'SUPERVISED'
              ? 'RESTRICTED'
              : a.status === 'RESTRICTED'
              ? 'QUARANTINED'
              : 'ACTIVE';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleRegisterAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentId) return;

    const newAgent: AgentInfo = {
      id: newAgentId.toLowerCase().replace(/\s+/g, '-'),
      name: newAgentName,
      type: newAgentType,
      status: 'ACTIVE',
      riskScore: 15,
      riskCategory: 'LOW',
      grantedScopes: newAgentScopes.split(',').map((s) => s.trim()),
      tools: newAgentTools.split(',').map((t) => t.trim()),
      lastActive: 'Registered now',
    };

    setAgents((prev) => [newAgent, ...prev]);
    setShowAddModal(false);
    setNewAgentName('');
    setNewAgentId('');
    setSessionSuccessMsg(`Agent "${newAgent.name}" registered into supervision fleet.`);
    setTimeout(() => setSessionSuccessMsg(null), 4000);
  };

  const handleExportCSV = () => {
    if (!recentActions.length) return;
    const headers = ['Time', 'Agent', 'Action', 'Target Path', 'Verdict', 'Risk'];
    const rows = recentActions.map((a) => [
      `"${a.created_at}"`,
      `"${a.agent_id || 'unknown'}"`,
      `"${a.action_type}"`,
      `"${(a.target_path || '').replace(/"/g, '""')}"`,
      `"${a.outcome}"`,
      a.risk_score,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agent_interceptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: AgentInfo['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-[#4EDEA3] border-[#4EDEA3]/30';
      case 'SUPERVISED':
        return 'bg-blue-500/10 text-[#93CCFF] border-[#93CCFF]/30';
      case 'RESTRICTED':
        return 'bg-amber-500/10 text-[#FFB95F] border-[#FFB95F]/30';
      case 'QUARANTINED':
        return 'bg-red-500/10 text-[#FF5449] border-[#FF5449]/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-[#FF5449] border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-[#FFB95F] border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-emerald-500/10 text-[#4EDEA3] border-[#4EDEA3]/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3F4850]/40 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-pulse"></span>
            AUTONOMOUS RUNTIME INTERCEPTION // AGENT SUPERVISION
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-wide mt-1">
            <Bot className="w-7 h-7 text-[#93CCFF]" />
            Agent Interceptor Fleet
          </h1>
          <p className="text-xs text-[#BFC7D2] font-medium mt-1">
            Live process hooks, dynamic permission sandboxing, and real-time pre-execution policy enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] text-xs font-mono font-bold shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            REGISTER AGENT
          </button>

          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] text-xs font-mono font-semibold text-[#DFE2F0] border border-[#3F4850]/50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#93CCFF] ${loading ? 'animate-spin' : ''}`} />
            REFRESH FLEET
          </button>
        </div>
      </div>

      {sessionSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-[#4EDEA3]/40 text-[#4EDEA3] text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {sessionSuccessMsg}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-[#FFB4AB] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B] font-mono text-[11px]">
            <span>SUPERVISED FLEET</span>
            <Bot className="w-4 h-4 text-[#93CCFF]" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{agents.length} RUNTIMES</p>
          <p className="text-[10px] text-[#4EDEA3] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3]"></span>
            Active interceptor hooks
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B] font-mono text-[11px]">
            <span>ACTIVE SESSION</span>
            <Terminal className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <p className="text-base font-bold text-white mt-2 font-mono truncate">
            {daemonStatus?.active_session_id ? daemonStatus.active_session_id.slice(0, 14) + '...' : 'NO ACTIVE SESSION'}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {daemonStatus?.active_session_id ? (
              <button
                onClick={handleEndSession}
                className="text-[10px] text-[#FF5449] hover:underline font-mono flex items-center gap-1 font-bold"
              >
                <Square className="w-2.5 h-2.5" /> END SESSION
              </button>
            ) : (
              <button
                onClick={() => handleStartSession(agents[0]?.id || 'agent-autogpt-core')}
                disabled={startingSession}
                className="text-[10px] text-[#93CCFF] hover:underline font-mono flex items-center gap-1 font-bold"
              >
                <Play className="w-2.5 h-2.5" /> START MONITORING
              </button>
            )}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B] font-mono text-[11px]">
            <span>POLICY ENFORCEMENT</span>
            <ShieldCheck className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <p className="text-2xl font-black text-[#4EDEA3] mt-2 font-mono">STRICT PRE-HOOK</p>
          <p className="text-[10px] text-[#89929B] font-mono mt-1">Zero-bypass execution barrier</p>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-lg">
          <div className="flex items-center justify-between text-[#89929B] font-mono text-[11px]">
            <span>DAEMON CIRCUIT</span>
            <Zap className="w-4 h-4 text-[#FFB95F]" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {daemonStatus?.circuit_breaker_state || 'CLOSED'}
          </p>
          <p className="text-[10px] text-[#4EDEA3] font-mono mt-1">Normal execution pipeline</p>
        </div>
      </div>

      {/* Supervised Agents List */}
      <div className="p-5 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#93CCFF]" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Supervised Agent Runtimes
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#89929B]">
            {agents.length} AGENTS READY TO HOOK
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 rounded-lg bg-[#141824] border border-[#3F4850]/40 hover:border-[#93CCFF]/40 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{agent.name}</span>
                    <button
                      onClick={() => handleToggleAgentStatus(agent.id)}
                      title="Click to cycle status"
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border transition hover:opacity-80 ${getStatusBadge(agent.status)}`}
                    >
                      {agent.status}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#89929B] font-mono mt-0.5">{agent.id} // {agent.type}</p>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getRiskBadge(agent.riskCategory)}`}>
                  RISK: {agent.riskScore}
                </span>
              </div>

              {/* Granted Scopes */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#89929B] uppercase">Granted Path Scopes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.grantedScopes.map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-0.5 rounded bg-[#1C1F29] border border-[#3F4850]/50 text-[10px] font-mono text-[#93CCFF]"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Tools */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#89929B] uppercase">Authorized Tools:</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded bg-[#0A0E17] border border-[#3F4850]/30 text-[9px] font-mono text-[#DFE2F0]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-[#3F4850]/30 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSimAgent(agent.id);
                    setSimTargetPath(agent.grantedScopes[0] + '/test.txt');
                    const el = document.getElementById('interceptor-tester');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[11px] font-mono text-[#93CCFF] hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" /> Test Interception Hook
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartSession(agent.id)}
                    disabled={startingSession}
                    className="text-[11px] font-mono text-[#4EDEA3] hover:underline flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Bind Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Interceptor Simulator */}
      <div id="interceptor-tester" className="p-5 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#93CCFF]" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Live Interceptor Diagnostic Simulator
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#4EDEA3] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3] animate-pulse"></span>
            CONNECTED TO PYTHON DAEMON (:8765)
          </span>
        </div>

        <p className="text-xs text-[#BFC7D2]">
          Execute real actions against the active Sentinel decision engine. This tests path boundaries, canary honeypots, and policy TOML evaluation in real-time.
        </p>

        <form onSubmit={handleSimulateIntercept} className="space-y-4 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-[#89929B] uppercase mb-1">Target Agent</label>
              <select
                value={simAgent}
                onChange={(e) => setSimAgent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white focus:outline-none focus:border-[#93CCFF]"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#89929B] uppercase mb-1">Action Type</label>
              <select
                value={simActionType}
                onChange={(e) => setSimActionType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white focus:outline-none focus:border-[#93CCFF]"
              >
                <option value="FILE_WRITE">FILE_WRITE (File Modification)</option>
                <option value="FILE_DELETE">FILE_DELETE (Destructive Purge)</option>
                <option value="SHELL_EXEC">SHELL_EXEC (Command Execution)</option>
                <option value="NETWORK_REQUEST">NETWORK_REQUEST (External Ingress)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#89929B] uppercase mb-1">Operation</label>
              <input
                type="text"
                value={simOperation}
                onChange={(e) => setSimOperation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white focus:outline-none focus:border-[#93CCFF]"
                placeholder="WRITE, DELETE, EXEC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#89929B] uppercase mb-1">Target Path / Resource</label>
              <input
                type="text"
                value={simTargetPath}
                onChange={(e) => setSimTargetPath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white focus:outline-none focus:border-[#93CCFF]"
                placeholder="e.g. sentinel_canary.env, ~/.ssh/id_rsa, /workspace/app.py"
              />
              <div className="flex flex-wrap gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setSimTargetPath('sentinel_canary.env')}
                  className="text-[9px] px-2 py-0.5 rounded bg-[#1C1F29] text-[#FF5449] border border-red-500/30"
                >
                  ⚡ Trigger Canary Honeypot
                </button>
                <button
                  type="button"
                  onClick={() => setSimTargetPath('~/.ssh/id_rsa')}
                  className="text-[9px] px-2 py-0.5 rounded bg-[#1C1F29] text-[#FFB95F] border border-amber-500/30"
                >
                  🔒 SSH Key Attack
                </button>
                <button
                  type="button"
                  onClick={() => setSimTargetPath('d:/GitHub/SentinelAI/workspace/file.txt')}
                  className="text-[9px] px-2 py-0.5 rounded bg-[#1C1F29] text-[#4EDEA3] border border-emerald-500/30"
                >
                  ✅ Safe Workspace Path
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#89929B] uppercase mb-1">Command / Execution Context</label>
              <input
                type="text"
                value={simCommand}
                onChange={(e) => setSimCommand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white focus:outline-none focus:border-[#93CCFF]"
                placeholder="echo malicious payload"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] text-xs font-bold transition shadow-md disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
            {simulating ? 'INTERCEPTING VIA DAEMON ENGINE...' : 'INTERCEPT & EVALUATE ACTION'}
          </button>
        </form>

        {/* Diagnostic Result */}
        {simResult && (
          <div
            className={`p-4 rounded-lg border font-mono space-y-2 mt-4 transition-all ${
              simResult.decision === 'ALLOW'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {simResult.decision === 'ALLOW' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#4EDEA3]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#FF5449]" />
                )}
                <span className="text-sm font-black tracking-wider">
                  VERDICT: {simResult.decision}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-black/40 border border-white/20">
                  RISK: {simResult.risk_score} / 100 ({simResult.risk_category})
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-black/40 border border-white/20">
                  REASON: {simResult.reason_code}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/90 pt-1 border-t border-white/10 font-sans">
              {simResult.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Recent Interception Stream */}
      <div className="p-5 rounded-xl bg-[#0E131F] border border-[#3F4850]/40 shadow-xl space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#93CCFF]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Intercepted Agent Stream
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#89929B]">
              LAST {recentActions.length} ACTIONS RECORDED IN SQLITE
            </span>
            <button
              onClick={handleExportCSV}
              disabled={!recentActions.length}
              className="flex items-center gap-1 text-[11px] text-[#93CCFF] hover:underline disabled:opacity-40"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3F4850]/50 text-[#89929B] text-[10px] uppercase">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Path</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3F4850]/30">
              {recentActions.map((action) => (
                <tr key={action.id} className="hover:bg-[#141824]/60 transition">
                  <td className="py-2.5 px-3 text-[#89929B] text-[11px]">
                    {formatLocalTime(action.created_at)}
                  </td>
                  <td className="py-2.5 px-3 text-[#93CCFF] font-semibold">
                    {action.agent_id || 'unknown'}
                  </td>
                  <td className="py-2.5 px-3 text-white font-medium">{action.action_type}</td>
                  <td className="py-2.5 px-3 text-[#DFE2F0] max-w-[200px] truncate">
                    {action.target_path || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        action.outcome.includes('BLOCK')
                          ? 'bg-red-500/10 text-[#FF5449] border-red-500/40'
                          : 'bg-emerald-500/10 text-[#4EDEA3] border-emerald-500/40'
                      }`}
                    >
                      {action.outcome}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#FFB95F] font-bold">{action.risk_score}</td>
                </tr>
              ))}
              {!recentActions.length && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#89929B] text-xs">
                    No intercepted actions recorded yet. Use the simulator above to test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#141824] border border-[#3F4850] shadow-2xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#93CCFF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Register Agent Runtime
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-[#1C1F29] text-[#89929B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#89929B] uppercase mb-1">Agent Name</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g., CodeGen MCP Agent"
                  required
                  className="w-full px-3 py-2 rounded bg-[#0E131F] border border-[#3F4850]/60 text-white focus:outline-none focus:border-[#93CCFF]"
                />
              </div>

              <div>
                <label className="block text-[#89929B] uppercase mb-1">Agent Identifier ID</label>
                <input
                  type="text"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  placeholder="e.g., agent-codegen-mcp"
                  required
                  className="w-full px-3 py-2 rounded bg-[#0E131F] border border-[#3F4850]/60 text-white focus:outline-none focus:border-[#93CCFF]"
                />
              </div>

              <div>
                <label className="block text-[#89929B] uppercase mb-1">Agent Type</label>
                <select
                  value={newAgentType}
                  onChange={(e) => setNewAgentType(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#0E131F] border border-[#3F4850]/60 text-white focus:outline-none focus:border-[#93CCFF]"
                >
                  <option value="AUTONOMOUS">AUTONOMOUS</option>
                  <option value="MCP">MCP</option>
                  <option value="SYSTEM_SHELL">SYSTEM_SHELL</option>
                  <option value="DATA_RETRIEVAL">DATA_RETRIEVAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[#89929B] uppercase mb-1">Granted Path Scopes (comma-separated)</label>
                <input
                  type="text"
                  value={newAgentScopes}
                  onChange={(e) => setNewAgentScopes(e.target.value)}
                  placeholder="d:/GitHub/SentinelAI/workspace, /tmp"
                  className="w-full px-3 py-2 rounded bg-[#0E131F] border border-[#3F4850]/60 text-white focus:outline-none focus:border-[#93CCFF]"
                />
              </div>

              <div>
                <label className="block text-[#89929B] uppercase mb-1">Authorized Capabilities / Tools</label>
                <input
                  type="text"
                  value={newAgentTools}
                  onChange={(e) => setNewAgentTools(e.target.value)}
                  placeholder="file_read, file_write, bash_exec"
                  className="w-full px-3 py-2 rounded bg-[#0E131F] border border-[#3F4850]/60 text-white focus:outline-none focus:border-[#93CCFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#3F4850]/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-[#181B25] hover:bg-[#1E2330] text-xs font-bold text-[#DFE2F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#3198DC] hover:bg-[#93CCFF] text-xs font-bold text-[#002C47]"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
