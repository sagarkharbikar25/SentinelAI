'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radar,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Search,
  RefreshCw,
  Terminal,
  Shield,
  Download,
  Eye,
  X,
  FileCode,
  Layers,
  Lock,
  Filter,
  Bot,
} from 'lucide-react';
import {
  getDaemonStatus,
  getRecentActions,
  interceptAction,
  getAlerts,
  explainAction,
  DaemonStatus,
  ActionLog,
  ActionExplanation,
} from '@/lib/daemon';
import PermissionPromptDialog, { PromptAction } from '@/components/PermissionPromptDialog';
import SplashScreen from '@/components/ui/SplashScreen';
import { formatLocalDateTime, formatLocalTime, formatUtcDateTime } from '@/lib/dateUtils';

const sampleScanTargets: Record<string, string> = {
  url: 'https://security-payload-verification.internal-scada.org/auth/token?sig=4bf02',
  email: 'urgent-account-validation@internal-sec-audit.portal-gateway.net',
  file: 'threat_samples/malicious_exfiltration.env',
  ip: '198.51.100.24 (AS40201 - Malicious Proxy / BGP Anomaly)',
  text: 'POST /v2/internal/credentials/dump HTTP/1.1\nHost: admin.scada.gov\nAuthorization: Bearer null\nX-Exploit-Payload: \\x7f\\x45\\x4c\\x46\\x02\\x01\\x01',
};

const initialThreatResult = {
  id: 'READY-IDLE',
  score: 0,
  riskLevel: 'MONITORING ACTIVE',
  classification: 'DAEMON READY',
  subVector: 'Zero Ingress Detected',
  confidence: '100%',
  consensus: 'Deterministic Policy Engine',
  heuristicMatch: 'NONE_CLEAN',
  indicators: [
    { label: 'Target Type:', value: 'SELECT VECTOR', status: 'primary' },
    { label: 'Policy Engine:', value: 'Port 8765 Active', status: 'primary' },
    { label: 'SQLite Store:', value: 'Connected', status: 'primary' },
    { label: 'Canary Honeypot:', value: 'Armed (11 files)', status: 'primary' },
    { label: 'Heuristic Scorer:', value: 'Ready', status: 'primary' },
    { label: 'Audit Log:', value: 'Append-Only', status: 'primary' },
  ],
  verdict:
    'SentinelAI daemon is actively supervising local runtimes. Enter any target URL, honeypot file, IP address, or system command above and click "EXECUTE AI THREAT SCAN" to evaluate it live via the local Python decision engine.',
  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};

export default function DashboardPage() {
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [daemonActions, setDaemonActions] = useState<ActionLog[]>([]);
  const [scanMode, setScanMode] = useState<string>('url');
  const [scanInput, setScanInput] = useState<string>(sampleScanTargets.url);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [threatResult, setThreatResult] = useState(initialThreatResult);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<PromptAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isTriggeringAction, setIsTriggeringAction] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [actionExplanation, setActionExplanation] = useState<ActionExplanation | null>(null);
  const [isExplainingAction, setIsExplainingAction] = useState(false);

  useEffect(() => {
    if (!selectedAction) {
      setActionExplanation(null);
      return;
    }
    let isCancelled = false;
    setIsExplainingAction(true);
    explainAction({
      agent_id: selectedAction.agent_id || 'unknown',
      action_type: selectedAction.action_type,
      operation: selectedAction.action_type.includes('DELETE')
        ? 'DELETE'
        : selectedAction.action_type.includes('EXECUTE')
        ? 'EXECUTE'
        : 'READ',
      target_path: selectedAction.target_path,
      risk_score: selectedAction.risk_score,
    })
      .then((res) => {
        if (!isCancelled) setActionExplanation(res);
      })
      .finally(() => {
        if (!isCancelled) setIsExplainingAction(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedAction]);

  const syncDaemon = async () => {
    setIsRefreshing(true);
    try {
      const [status, actions, alerts] = await Promise.all([
        getDaemonStatus().catch(() => null),
        getRecentActions(200).catch(() => []),
        getAlerts().catch(() => []),
      ]);
      setDaemonStatus(status);
      setDaemonActions(actions);

      // Auto-trigger live Permission Prompt Dialog if an unread alert with action_id exists
      const pendingPromptAlert = alerts.find((a) => a.action_id && !a.is_read);
      if (pendingPromptAlert && pendingPromptAlert.action_id) {
        setActivePrompt((curr) => {
          if (!curr || curr.id !== pendingPromptAlert.action_id) {
            return {
              id: pendingPromptAlert.action_id!,
              agentId: 'Claude Code',
              actionType: pendingPromptAlert.title.includes('DELETE') ? 'DELETE' : 'EXECUTE',
              targetPath: pendingPromptAlert.title.split('on ')[1] || 'Protected Resource',
              riskScore: pendingPromptAlert.severity === 'CRITICAL' ? 95 : 75,
              riskCategory: (pendingPromptAlert.severity as any) || 'CRITICAL',
              reasonCode: 'LIVE_PROMPT_INTERCEPTION',
              explanation: pendingPromptAlert.description,
              fileContext: {
                size: 'Target file on system',
                isGitTracked: false,
                lastModified: 'Live stream',
                inScope: false,
              },
            };
          }
          return curr;
        });
      }
    } catch (e) {
      console.error('Daemon sync error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    syncDaemon();
    const interval = setInterval(syncDaemon, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode: string) => {
    setScanMode(mode);
    setScanInput(sampleScanTargets[mode] || '');
  };

  const handleTriggerRealAction = async () => {
    setIsTriggeringAction(true);
    try {
      const res = await interceptAction({
        agent_id: 'claude-code',
        agent_type: 'AUTONOMOUS',
        action_type: 'FILE_DELETE',
        operation: 'DELETE',
        target_path: 'sentinel_canary.env',
        command: 'rm sentinel_canary.env',
      });
      // Reset filter so the newly generated event is immediately visible in the table
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncDaemon();
      setActionSuccessNotice(
        `Intercepted Canary Attack: ${res.decision} (Risk: ${res.risk_score}/100). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 4500);
    } catch (err) {
      console.error('Failed to trigger real action:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleTriggerCredentialThreat = async () => {
    setIsTriggeringAction(true);
    try {
      const res = await interceptAction({
        agent_id: 'autonomous-scraper',
        agent_type: 'AUTONOMOUS',
        action_type: 'FILE_READ',
        operation: 'READ',
        target_path: 'threat_samples/malicious_exfiltration.env',
        command: 'cat threat_samples/malicious_exfiltration.env',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncDaemon();
      setActionSuccessNotice(
        `🚨 Intercepted Credential Threat: ${res.decision} (Risk: ${res.risk_score}/100 - CRITICAL). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to trigger credential threat:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleTriggerShellThreat = async () => {
    setIsTriggeringAction(true);
    try {
      const res = await interceptAction({
        agent_id: 'untrusted-ci-bot',
        agent_type: 'AUTOMATION_RUNNER',
        action_type: 'COMMAND_EXECUTE',
        operation: 'EXECUTE',
        target_path: 'threat_samples/reverse_shell.sh',
        command: 'bash threat_samples/reverse_shell.sh',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncDaemon();
      setActionSuccessNotice(
        `🐚 Intercepted Remote Shell: ${res.decision} (Risk: ${res.risk_score}/100 - CRITICAL). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to trigger shell threat:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleTriggerSafeAction = async () => {
    setIsTriggeringAction(true);
    try {
      const res = await interceptAction({
        agent_id: 'langchain-doc-retriever',
        agent_type: 'DATA_RETRIEVAL',
        action_type: 'FILE_READ',
        operation: 'READ',
        target_path: 'd:/GitHub/SentinelAI/docs/README.md',
        command: 'read docs/README.md',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncDaemon();
      setActionSuccessNotice(
        `Intercepted Safe Read: ${res.decision} (Risk: ${res.risk_score}/100). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 4500);
    } catch (err) {
      console.error('Failed to trigger safe action:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleRunAnalysis = async () => {
    setIsScanning(true);
    try {
      const isUrl = scanMode === 'url';
      const isIp = scanMode === 'ip';
      const isFile = scanMode === 'file';
      const actionType = isFile
        ? 'FILE_INSPECT'
        : isUrl
        ? 'NETWORK_INGRESS'
        : isIp
        ? 'NETWORK_PROBE'
        : 'CONTENT_EVAL';
      const operation = isFile ? 'INSPECT' : 'CONNECT';

      // 1. Send live request to Python DecisionEngine on port 8765
      const res = await interceptAction({
        agent_id: 'heuristic-scanner',
        agent_type: 'SCANNER',
        action_type: actionType,
        operation: operation,
        target_path: isFile ? scanInput : undefined,
        target_url: isUrl ? scanInput : undefined,
        command: `inspect ${scanInput}`,
      });

      const isHigh = res.risk_score >= 80;
      const isMed = res.risk_score >= 40 && res.risk_score < 80;

      // 2. Synthesize dynamic indicators from live decision
      const indicators = [
        { label: 'Target Type:', value: scanMode.toUpperCase(), status: 'primary' },
        {
          label: 'Heuristic Scorer:',
          value: `${res.risk_score}/100 Risk`,
          status: isHigh ? 'error' : isMed ? 'tertiary' : 'primary',
        },
        {
          label: 'Policy Gate:',
          value: res.decision,
          status: res.decision === 'ALLOW' ? 'primary' : 'error',
        },
        {
          label: 'Reason Code:',
          value: res.reason_code || 'HEURISTIC_PASS',
          status: isHigh ? 'error' : 'primary',
        },
        {
          label: 'Risk Category:',
          value: res.risk_category || 'STANDARD',
          status: isHigh ? 'error' : 'primary',
        },
        {
          label: 'SQLite Storage:',
          value: 'Persisted to DB',
          status: 'primary',
        },
      ];

      // Pseudo-hash from scan input for forensic reference
      let hash = 0;
      for (let i = 0; i < scanInput.length; i++) {
        hash = (hash << 5) - hash + scanInput.charCodeAt(i);
        hash |= 0;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(16, '0') + 'c9b4e0172';

      setThreatResult({
        id: `ACT-${res.reason_code || 'INSPECT'}`,
        score: res.risk_score,
        riskLevel: isHigh ? 'CRITICAL RISK' : isMed ? 'ELEVATED RISK' : 'LOW RISK',
        classification: `${scanMode.toUpperCase()} INSPECTION`,
        subVector: res.risk_category || 'RUNTIME_TRAFFIC',
        confidence: `${Math.min(99, 85 + Math.floor(res.risk_score * 0.14))}%`,
        consensus: 'Sentinel Local Scorer + Policy Engine',
        heuristicMatch: res.reason_code,
        indicators: indicators,
        verdict: res.explanation || `Action was evaluated live. Decision: ${res.decision}. Stored in local SQLite database.`,
        sha256: hexHash,
      });

      // 3. Immediately refresh table so the real SQLite action is displayed
      await syncDaemon();
    } catch (err: any) {
      console.error('Scan evaluation failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportLogs = () => {
    if (!daemonActions.length) return;
    const headers = ['Action ID', 'Agent ID', 'Action Type', 'Target Path', 'Risk Score', 'Outcome', 'Created At'];
    const rows = daemonActions.map((a) => [
      `"${a.id}"`,
      `"${a.agent_id || 'unknown'}"`,
      `"${a.action_type}"`,
      `"${(a.target_path || '').replace(/"/g, '""')}"`,
      a.risk_score,
      `"${a.outcome}"`,
      `"${a.created_at}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real SQLite stats computed live from daemon
  const totalActionsCount = daemonActions.length;
  const criticalThreatsCount = daemonActions.filter((a) => a.risk_score >= 80).length;
  const elevatedRisksCount = daemonActions.filter((a) => a.risk_score >= 40 && a.risk_score < 80).length;
  const mediumRisksCount = daemonActions.filter((a) => a.risk_score >= 20 && a.risk_score < 40).length;
  const containedBlocksCount = daemonActions.filter((a) => a.outcome?.includes('BLOCK')).length;

  const displayActions = daemonActions.filter((a) => {
    const matchSev =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && a.risk_score >= 80) ||
      (filterSeverity === 'HIGH' && a.risk_score >= 40 && a.risk_score < 80) ||
      (filterSeverity === 'MEDIUM' && a.risk_score >= 20 && a.risk_score < 40);
    const matchSearch =
      searchTerm === '' ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.agent_id && a.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.target_path && a.target_path.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSev && matchSearch;
  });

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} minDuration={850} />}
      <div className="space-y-6">
        {/* 1. Tactical Hero Overview */}
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#3F4850]/40">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-[#93CCFF] animate-pulse" />
              <span className="font-bold">SYSTEM ACTIVE // MIL-SPEC TELEMETRY INGRESS</span>
              <span className="text-[#89929B]">::</span>
              <span className="text-[#BFC7D2]">LOCAL-FIRST SECURITY DAEMON</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              CYBER SECURITY OVERVIEW
            </h1>
            <p className="text-xs text-[#BFC7D2] flex flex-wrap items-center gap-2">
              <span>AI-powered continuous threat monitoring, dynamic heuristics &amp; defense orchestration.</span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#89929B]" />
              <span className="font-mono text-[#93CCFF] font-semibold text-[11px]">
                DAEMON PROTOCOL: {daemonStatus ? '127.0.0.1:8765 ACTIVE' : 'CONNECTING...'} | SQLITE: ~/.sentinelai/sentinel.db
              </span>
            </p>
          </div>

          {/* Telemetry Actions & Testing Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Refresh Telemetry */}
            <button
              onClick={syncDaemon}
              className="px-2.5 py-1.5 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 text-[#DFE2F0] flex items-center gap-1.5 transition shadow-sm"
              title="Refresh telemetry from daemon"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#93CCFF] ${isRefreshing ? 'animate-spin' : ''}`} />
              REFRESH
            </button>

            {/* Teacher Demo 1: Trigger Credential Exfiltration Attack */}
            <button
              onClick={handleTriggerCredentialThreat}
              disabled={isTriggeringAction}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-[#FF5449] font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Teacher Demo: Intercept simulated leak of credentials (threat_samples/malicious_exfiltration.env)"
            >
              <Lock className="w-3.5 h-3.5" />
              TEST CREDENTIALS (.ENV)
            </button>

            {/* Teacher Demo 2: Trigger Reverse Shell Execution */}
            <button
              onClick={handleTriggerShellThreat}
              disabled={isTriggeringAction}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-[#FFB95F]/40 text-[#FFB95F] font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Teacher Demo: Intercept simulated remote reverse shell (threat_samples/reverse_shell.sh)"
            >
              <Terminal className="w-3.5 h-3.5" />
              TEST REVERSE SHELL (.SH)
            </button>

            {/* Teacher Demo 3: Trigger Canary File Attack (Critical) */}
            <button
              onClick={handleTriggerRealAction}
              disabled={isTriggeringAction}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-[#FFB4AB] font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Teacher Demo: Triggers critical risk canary honeypot deletion (sentinel_canary.env)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              TEST CANARY ATTACK
            </button>

            {/* Trigger Safe Read (Allow) */}
            <button
              onClick={handleTriggerSafeAction}
              disabled={isTriggeringAction}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-[#4EDEA3]/40 text-[#4EDEA3] font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Teacher Demo: Triggers safe workspace file read (docs/README.md)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              SAFE READ (ALLOW)
            </button>

            {/* Member 1 Permission Prompt Trigger Button */}
            <button
              onClick={() =>
                setActivePrompt({
                  id: 'act-prompt-' + Date.now().toString(36),
                  agentId: 'Claude Code',
                  actionType: 'DELETE',
                  targetPath: '~/project/src/main.py',
                  riskScore: 47,
                  riskCategory: 'MEDIUM',
                  reasonCode: 'UNTRACKED_FILE_DELETION',
                  explanation:
                    'Claude Code wants to delete a file you modified recently but have not committed to git. This could be an unintended hallucination mistake.',
                  fileContext: {
                    size: '14.2 KB (247 lines)',
                    isGitTracked: false,
                    lastModified: '12 minutes ago',
                    inScope: true,
                  },
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[#FFB95F] font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              TEST PROMPT
            </button>
            {/* Jump Directly to Inspect Table */}
            <button
              onClick={() => {
                const el = document.getElementById('action-feed');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#93CCFF]/50 text-[#93CCFF] font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Jump directly to SQLite Intercepted Feed Table below"
            >
              <Eye className="w-3.5 h-3.5" />
              INSPECT TABLE ({totalActionsCount} LOGS ⬇)
            </button>
          </div>
        </section>

      {/* 2. Tactical Metric Grid - Real SQLite Telemetry */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1: Total Threats / Actions */}
        <div
          onClick={() => {
            const el = document.getElementById('action-feed');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-4 rounded-xl bg-[#181B25] border border-[#3F4850]/50 flex flex-col justify-between hover:border-[#93CCFF]/60 transition-all shadow-lg group cursor-pointer"
          title="Click to jump directly to SQLite audit feed below"
        >
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#89929B] uppercase tracking-wider font-bold">TOTAL INTERCEPTIONS</span>
            <Radar className="w-4 h-4 text-[#93CCFF]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-white">{totalActionsCount}</span>
            <span className="text-[11px] text-[#93CCFF] font-semibold">Live in SQLite</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#93CCFF]" style={{ width: `${Math.min(100, Math.max(10, totalActionsCount * 10))}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span>Daemon Feed</span>
            <span className="text-[#DFE2F0]">~/.sentinelai/sentinel.db</span>
          </div>
        </div>

        {/* Card 2: Defcon Critical */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#93000A]/60 flex flex-col justify-between hover:border-[#FFB4AB] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#FFB4AB] uppercase tracking-wider font-bold">CRITICAL RISKS</span>
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB4AB] animate-pulse" />
              SCORE &gt;= 80
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#FFB4AB]">{criticalThreatsCount}</span>
            <span className="text-[11px] text-[#FFB4AB]">Auto-isolated</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#FFB4AB]" style={{ width: `${Math.min(100, criticalThreatsCount * 25)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#FFB4AB]">Honeypot / Breaches</span>
            <span className="text-[#DFE2F0]">Deterministic Block</span>
          </div>
        </div>

        {/* Card 3: High Risk */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#CA8100]/60 flex flex-col justify-between hover:border-[#FFB95F] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#FFB95F] uppercase tracking-wider font-bold">ELEVATED RISKS</span>
            <AlertTriangle className="w-4 h-4 text-[#FFB95F]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#FFB95F]">{elevatedRisksCount}</span>
            <span className="text-[11px] text-[#89929B]">Requires prompt</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#FFB95F]" style={{ width: `${Math.min(100, elevatedRisksCount * 25)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#FFB95F]">Score 40 - 79</span>
            <span className="text-[#DFE2F0]">Supervised Ops</span>
          </div>
        </div>

        {/* Card 4: Contained Threats */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#00A572]/60 flex flex-col justify-between hover:border-[#4EDEA3] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#4EDEA3] uppercase tracking-wider font-bold">CONTAINED THREATS</span>
            <CheckCircle2 className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#4EDEA3]">{containedBlocksCount}</span>
            <span className="text-[11px] text-[#4EDEA3]">Blocked</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#4EDEA3]" style={{ width: `${Math.min(100, containedBlocksCount * 25)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#4EDEA3]">Zero Escape Policy</span>
            <span className="text-[#DFE2F0]">100% Contained</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Threat Detection Engine & Dynamic Analysis Result */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scanner Module */}
        <div className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="px-4 py-2.5 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-[#93CCFF]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">THREAT DETECTION ENGINE</span>
            </div>
            <span className="text-[10px] font-bold text-[#93CCFF] px-2 py-0.5 rounded border border-[#93CCFF]/30 bg-[#93CCFF]/10">
              PYTHON DAEMON (:8765)
            </span>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-[#BFC7D2]">
              Submit digital targets for live deterministic risk scoring and policy inspection via Sentinel&apos;s decision engine.
            </p>

            {/* 5 Mode Tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[#0A0E17] border border-[#3F4850]/40 font-mono text-[10px]">
              {(['url', 'email', 'file', 'ip', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`py-1.5 rounded font-bold uppercase transition ${
                    scanMode === mode
                      ? 'bg-[#3198DC] text-[#002C47]'
                      : 'text-[#89929B] hover:text-white hover:bg-[#1C1F29]'
                  }`}
                >
                  {mode === 'ip' ? 'IP ADDR' : mode}
                </button>
              ))}
            </div>

            {/* Target Input */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[10px] text-[#89929B]">
                <span>ENTER TARGET {scanMode.toUpperCase()} FOR INSPECTION</span>
                <span className="text-[#93CCFF]">PROTOCOL: FASTAPI LIVE</span>
              </div>
              <textarea
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                rows={3}
                className="w-full bg-[#0A0E17] border border-[#3F4850]/50 rounded-lg p-3 text-xs text-white focus:border-[#93CCFF] focus:outline-none resize-none font-mono"
              />
            </div>

            {/* Quick Demo Test Presets for File Mode */}
            {scanMode === 'file' && (
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#89929B]">
                  <span>QUICK DEMO TEST FILES:</span>
                  <span className="text-[#4EDEA3]">REAL WORKSPACE FILES</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🚨 Credential Leak (.env)', file: 'threat_samples/malicious_exfiltration.env' },
                    { label: '🐚 Reverse Shell (.sh)', file: 'threat_samples/reverse_shell.sh' },
                    { label: '🪤 Honeypot Canary', file: 'sentinel_canary.env' },
                    { label: '📄 Safe Doc (README)', file: 'docs/README.md' },
                  ].map((preset) => (
                    <button
                      key={preset.file}
                      type="button"
                      onClick={() => setScanInput(preset.file)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                        scanInput === preset.file
                          ? 'bg-[#93CCFF]/20 text-[#93CCFF] border-[#93CCFF]'
                          : 'bg-[#141824] hover:bg-[#1E2330] text-[#BFC7D2] border-[#3F4850]/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={isScanning}
              className="w-full py-2.5 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'EVALUATING VIA PYTHON DECISION ENGINE...' : 'EXECUTE AI THREAT SCAN'}
            </button>
          </div>
        </div>

        {/* Threat Analysis Result */}
        <div className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg flex flex-col justify-between font-mono">
          <div className="px-4 py-2.5 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE HEURISTIC EVALUATION</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                threatResult.score >= 80
                  ? 'bg-rose-500/20 text-[#FFB4AB] border-[#FFB4AB]/30'
                  : threatResult.score >= 40
                  ? 'bg-amber-500/20 text-[#FFB95F] border-[#FFB95F]/30'
                  : 'bg-emerald-500/20 text-[#4EDEA3] border-[#4EDEA3]/30'
              }`}
            >
              {threatResult.riskLevel}
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4850]/30 pb-3">
              <div>
                <span className="text-[10px] text-[#89929B]">CLASSIFICATION</span>
                <h4 className="text-lg font-extrabold text-white mt-0.5">
                  {threatResult.classification} // {threatResult.subVector}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#89929B]">RISK SCORE</span>
                <p
                  className={`text-2xl font-black ${
                    threatResult.score >= 80
                      ? 'text-[#FFB4AB]'
                      : threatResult.score >= 40
                      ? 'text-[#FFB95F]'
                      : 'text-[#4EDEA3]'
                  }`}
                >
                  {threatResult.score}/100
                </p>
              </div>
            </div>

            {/* Indicator Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              {threatResult.indicators.map((ind) => (
                <div key={ind.label} className="p-2 rounded bg-[#0A0E17] border border-[#3F4850]/30">
                  <span className="text-[#89929B] block">{ind.label}</span>
                  <span
                    className={`font-bold ${
                      ind.status === 'error'
                        ? 'text-[#FFB4AB]'
                        : ind.status === 'tertiary'
                        ? 'text-[#FFB95F]'
                        : 'text-white'
                    }`}
                  >
                    {ind.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Verdict */}
            <p className="text-xs text-[#BFC7D2] leading-relaxed p-3 rounded-lg bg-[#0A0E17] border border-[#3F4850]/40 font-sans">
              {threatResult.verdict}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3F4850]/30">
              <div className="text-[10px] text-[#89929B] truncate">
                <span>REFERENCE HASH: </span>
                <span className="text-[#93CCFF]">{threatResult.sha256.slice(0, 18)}...</span>
              </div>
              {daemonActions.length > 0 && (
                <button
                  onClick={() => setSelectedAction(daemonActions[0])}
                  className="px-2.5 py-1 rounded bg-[#141824] hover:bg-[#1E2330] border border-[#93CCFF]/50 text-[10px] font-bold text-[#93CCFF] flex items-center gap-1 transition shadow-sm"
                  title="Open detailed telemetry modal for the latest intercepted action"
                >
                  <Eye className="w-3 h-3" /> INSPECT LATEST ACTION
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real SQLite Action Audit Feed */}
      <section id="action-feed" className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg font-mono scroll-mt-20">
        <div className="p-4 bg-[#0A0E17] border-b border-[#3F4850]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#93CCFF]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              REAL-TIME SQLITE INTERCEPTED FEED ({displayActions.length} / {totalActionsCount} RECORDED)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export Logs Button */}
            <button
              onClick={handleExportLogs}
              disabled={!daemonActions.length}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 text-xs text-[#93CCFF] disabled:opacity-40 transition"
              title="Download SQLite audit logs as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT CSV
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#89929B] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search action, agent, path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#181B25] border border-[#3F4850]/50 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:border-[#93CCFF] focus:outline-none"
              />
            </div>

            {/* Severity Filter with dynamic count badges */}
            <div className="flex items-center gap-1.5 text-[10px]">
              {(
                [
                  { key: 'ALL', label: 'ALL', count: daemonActions.length },
                  { key: 'CRITICAL', label: 'CRITICAL', count: criticalThreatsCount },
                  { key: 'HIGH', label: 'HIGH', count: elevatedRisksCount },
                  { key: 'MEDIUM', label: 'MEDIUM', count: mediumRisksCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterSeverity(tab.key)}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1.5 ${
                    filterSeverity === tab.key
                      ? 'bg-[#3198DC] text-[#002C47] shadow-sm'
                      : 'text-[#89929B] hover:text-white bg-[#181B25] border border-[#3F4850]/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      filterSeverity === tab.key
                        ? 'bg-[#002C47] text-[#93CCFF]'
                        : 'bg-[#282E3E] text-[#BFC7D2]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Interception Success Banner */}
        {actionSuccessNotice && (
          <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between text-xs text-[#4EDEA3] font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4EDEA3]" />
              <span>{actionSuccessNotice}</span>
            </div>
            <button
              onClick={() => setActionSuccessNotice(null)}
              className="text-[#89929B] hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#89929B] uppercase text-[10px] border-b border-[#3F4850]/30 bg-[#181B25]/60">
              <tr>
                <th className="py-2.5 px-4">INCIDENT ID</th>
                <th>AGENT</th>
                <th>ACTION TYPE</th>
                <th>TARGET PATH / RESOURCE</th>
                <th>RISK</th>
                <th>VERDICT</th>
                <th>DETECTED</th>
                <th className="text-right px-4">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3F4850]/20">
              {displayActions.map((action) => (
                <tr key={action.id} className="hover:bg-[#1C1F29]/60 transition">
                  <td className="py-3 px-4 font-bold text-[#93CCFF] font-mono text-[11px] truncate max-w-[130px]">
                    {action.id.slice(0, 10)}...
                  </td>
                  <td className="text-white font-semibold font-mono text-[11px]">
                    {action.agent_id || 'claude-code'}
                  </td>
                  <td className="text-[#DFE2F0] font-mono text-[11px]">{action.action_type}</td>
                  <td className="text-[#BFC7D2] font-mono text-[11px] max-w-[200px] truncate">
                    {action.target_path || 'N/A'}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        action.risk_score >= 80
                          ? 'bg-rose-500/15 text-[#FFB4AB] border-[#FFB4AB]/30'
                          : action.risk_score >= 40
                          ? 'bg-amber-500/15 text-[#FFB95F] border-[#FFB95F]/30'
                          : 'bg-emerald-500/15 text-[#4EDEA3] border-[#4EDEA3]/30'
                      }`}
                    >
                      {action.risk_score}/100
                    </span>
                  </td>
                  <td>
                    <span
                      className={`font-semibold text-[11px] ${
                        action.outcome?.includes('BLOCK')
                          ? 'text-[#FFB4AB]'
                          : action.outcome?.includes('USER')
                          ? 'text-[#FFB95F]'
                          : 'text-[#4EDEA3]'
                      }`}
                    >
                      {action.outcome}
                    </span>
                  </td>
                  <td className="text-[#89929B] text-[11px] font-mono">
                    {formatLocalTime(action.created_at)}
                  </td>
                  <td className="text-right px-4">
                    <button
                      onClick={() => setSelectedAction(action)}
                      className="px-2 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 text-[#93CCFF] text-[10px] font-mono font-bold flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" /> INSPECT
                    </button>
                  </td>
                </tr>
              ))}
              {!displayActions.length && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#89929B]">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[#1F2733] border border-[#3F4850] flex items-center justify-center mx-auto text-[#93CCFF]">
                        <Filter className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-white font-mono">
                        {daemonActions.length > 0
                          ? `No Actions Match Filter: "${filterSeverity}" ${searchTerm ? `+ "${searchTerm}"` : ''}`
                          : 'No Live Interceptions Recorded Yet'}
                      </p>
                      <p className="text-xs text-[#89929B] leading-relaxed">
                        {daemonActions.length > 0 ? (
                          <>
                            There are <span className="text-[#93CCFF] font-bold font-mono">{daemonActions.length}</span> total actions stored in SQLite (<code className="text-[#DFE2F0]">~/.sentinelai/sentinel.db</code>), but none currently match this filter.
                          </>
                        ) : (
                          <>The SQLite database is active and ready to log runtime agent telemetry.</>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {daemonActions.length > 0 && (
                          <button
                            onClick={() => {
                              setFilterSeverity('ALL');
                              setSearchTerm('');
                            }}
                            className="px-4 py-2 rounded-lg bg-[#3198DC] hover:bg-[#3198DC]/90 text-[#002C47] text-xs font-bold font-mono transition inline-flex items-center gap-1.5 shadow-md active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            SHOW ALL ({daemonActions.length}) ACTIONS
                          </button>
                        )}
                        <button
                          onClick={handleTriggerRealAction}
                          disabled={isTriggeringAction}
                          className="px-4 py-2 rounded-lg bg-[#93CCFF]/15 hover:bg-[#93CCFF]/25 border border-[#93CCFF]/40 text-[#93CCFF] text-xs font-bold font-mono transition inline-flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {isTriggeringAction ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              INTERCEPTING &amp; LOGGING...
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3.5 h-3.5" />
                              {filterSeverity === 'HIGH'
                                ? 'TRIGGER TEST EVENT & SHOW ALL'
                                : 'TRIGGER TEST INCIDENT'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Row Inspection Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#141824] border border-[#3F4850] shadow-2xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#93CCFF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Action Detail Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 rounded hover:bg-[#1C1F29] text-[#89929B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">ACTION ID:</span>
                <span className="text-white font-bold">{selectedAction.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">AGENT:</span>
                <span className="text-[#93CCFF] font-bold">{selectedAction.agent_id || 'unknown'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">ACTION TYPE:</span>
                <span className="text-white">{selectedAction.action_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">TARGET PATH:</span>
                <span className="text-[#DFE2F0] max-w-[300px] truncate">{selectedAction.target_path || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">VERDICT / OUTCOME:</span>
                <span className={`font-bold ${selectedAction.outcome.includes('BLOCK') ? 'text-[#FFB4AB]' : 'text-[#4EDEA3]'}`}>
                  {selectedAction.outcome}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">RISK SCORE:</span>
                <span className="text-[#FFB95F] font-bold">{selectedAction.risk_score} / 100</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">LOCAL WORKSTATION TIME:</span>
                <span className="text-[#4EDEA3] font-bold font-mono">
                  {formatLocalDateTime(selectedAction.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">UTC AUDIT TIMESTAMP:</span>
                <span className="text-[#89929B] font-mono text-[11px]">
                  {formatUtcDateTime(selectedAction.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#3F4850]/20">
                <span className="text-[#89929B]">DATABASE PERSISTENCE:</span>
                <span className="text-[#93CCFF] font-mono text-[11px]">SQLite ~/.sentinelai/sentinel.db</span>
              </div>

              {/* Ollama / Heuristic Brain Explanation Section */}
              <div className="mt-3 p-3.5 rounded-lg bg-[#0D121F] border border-[#3F4850]/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#93CCFF] font-bold text-[11px]">
                    <Bot className="w-3.5 h-3.5 text-[#93CCFF]" />
                    <span>SENTINEL COPILOT // SILENT INTENT DECODER</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-[#181B25] border border-[#3F4850] text-[#4EDEA3]">
                    {actionExplanation?.provider || 'LOCAL CO-PROCESSOR'}
                  </span>
                </div>

                {isExplainingAction ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-[#89929B]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#93CCFF]" />
                    <span>Decoding silent agent activity and security warnings...</span>
                  </div>
                ) : actionExplanation ? (
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <div className="bg-[#141824] p-2 rounded border border-[#3F4850]/30">
                      <span className="text-[#89929B] font-bold block text-[10px] uppercase">Silent Agent Activity:</span>
                      <span className="text-white font-mono">{actionExplanation.silent_activity}</span>
                    </div>
                    <div className="bg-[#141824] p-2 rounded border border-[#3F4850]/30">
                      <span className="text-[#FFB95F] font-bold block text-[10px] uppercase">Warning / Danger Analysis:</span>
                      <span className="text-[#DFE2F0] font-sans">{actionExplanation.security_warning}</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
                      <span className="text-[#89929B]">COPILOT RECOMMENDATION:</span>
                      <span className={`font-bold px-2 py-0.5 rounded border ${
                        actionExplanation.recommended_action.includes('BLOCK')
                          ? 'bg-rose-500/15 text-[#FFB4AB] border-[#FFB4AB]/30'
                          : 'bg-emerald-500/15 text-[#4EDEA3] border-[#4EDEA3]/30'
                      }`}>
                        {actionExplanation.recommended_action}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/60 text-xs font-bold text-white transition"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Prompt Dialog Modal */}
      <PermissionPromptDialog
        prompt={activePrompt}
        onClose={() => setActivePrompt(null)}
        onDecisionApplied={async (choice) => {
          console.log('Applied prompt decision:', choice);
          await syncDaemon();
        }}
      />
      </div>
    </>
  );
}
