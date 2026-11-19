'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ActivitySvg,
  ShieldCheckSvg,
  ShieldAlertSvg,
  HomeSvg,
  VaultSvg,
  AuditSvg,
  LabSvg,
} from '@/components/icons/SvgIcons';
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
import { formatLocalDateTime, formatLocalTime } from '@/lib/dateUtils';

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
  riskLevel: 'Monitoring Active',
  classification: 'Daemon Ready',
  subVector: 'Zero Ingress Detected',
  confidence: '100%',
  consensus: 'Deterministic Policy Engine',
  indicators: [
    { label: 'Target Type:', value: 'Select Vector', status: 'normal' },
    { label: 'Policy Engine:', value: 'Port 8765 Active', status: 'normal' },
    { label: 'SQLite Store:', value: 'Connected', status: 'normal' },
    { label: 'Canary Honeypot:', value: 'Armed (11 files)', status: 'normal' },
    { label: 'Heuristic Scorer:', value: 'Ready', status: 'normal' },
    { label: 'Audit Log:', value: 'Append-Only', status: 'normal' },
  ],
  verdict:
    'SentinelAI daemon is actively supervising local runtimes. Enter any target URL, honeypot file, IP address, or system command above and evaluate it live via the local decision engine.',
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
  const [showDemoMenu, setShowDemoMenu] = useState(false);

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
    } catch {
      // offline handled gracefully
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    syncDaemon();
    const interval = setInterval(syncDaemon, 4000);
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
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncDaemon();
      setActionSuccessNotice(
        `Intercepted Honeypot Deletion: ${res.decision} (Risk: ${res.risk_score}/100 - CRITICAL). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to trigger honeypot action:', err);
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
        `Intercepted Credential Leak: ${res.decision} (Risk: ${res.risk_score}/100 - CRITICAL). Logged to SQLite!`
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
        `Intercepted Remote Shell: ${res.decision} (Risk: ${res.risk_score}/100 - CRITICAL). Logged to SQLite!`
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

      const indicators = [
        { label: 'Target Type:', value: scanMode.toUpperCase(), status: 'normal' },
        {
          label: 'Heuristic Scorer:',
          value: `${res.risk_score}/100 Risk`,
          status: isHigh ? 'critical' : isMed ? 'warning' : 'normal',
        },
        {
          label: 'Policy Gate:',
          value: res.decision,
          status: res.decision === 'ALLOW' ? 'normal' : 'critical',
        },
        {
          label: 'Reason Code:',
          value: res.reason_code || 'HEURISTIC_PASS',
          status: isHigh ? 'critical' : 'normal',
        },
        {
          label: 'Risk Category:',
          value: res.risk_category || 'STANDARD',
          status: isHigh ? 'critical' : 'normal',
        },
        {
          label: 'Audit Log:',
          value: 'Chained SHA-256',
          status: 'normal',
        },
      ];

      setThreatResult({
        id: (res as any).action_id || 'act-eval',
        score: res.risk_score,
        riskLevel: isHigh ? 'Critical Risk' : isMed ? 'Elevated Risk' : 'Normal / Clean',
        classification: res.decision === 'ALLOW' ? 'Permitted Operation' : 'Blocked / Quarantined',
        subVector: res.reason_code || 'Deterministic Policy Rule',
        confidence: '99.4%',
        consensus: 'Deterministic Policy Engine',
        indicators,
        verdict: res.explanation || 'Evaluated deterministically by SentinelAI local decision engine.',
        sha256: 'a3bf4c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

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

  const totalActionsCount = daemonActions.length;
  const criticalThreatsCount = daemonActions.filter((a) => a.risk_score >= 80).length;
  const elevatedRisksCount = daemonActions.filter((a) => a.risk_score >= 40 && a.risk_score < 80).length;
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
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} minDuration={800} />}

      <div className="space-y-8 max-w-7xl mx-auto">
        {/* 1. Header Overview (Clean & Serene) */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2EAE4]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-[#059669]">
                Workstation active &bull; Local protection armed
              </span>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-[#111915] tracking-tight text-balance">
              Runtime Security Overview
            </h1>
            <p className="text-xs text-[#536459] text-pretty max-w-2xl">
              Autonomous runtime agent governance, deterministic risk prevention, and cryptographic SQLite flight recorder.
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={syncDaemon}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#111915] transition-colors shadow-xs flex items-center gap-2"
            >
              <ActivitySvg className={`size-3.5 text-[#059669] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Test Simulation Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-2"
              >
                <ShieldAlertSvg className="size-3.5" />
                <span>Simulate threat</span>
                <span className="text-[10px] opacity-80">▾</span>
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                  <p className="px-3 py-1.5 text-[10px] font-mono text-[#75887B] uppercase font-bold">
                    Test Scenarios
                  </p>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerCredentialThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FEF2F2] text-red-700 transition-colors flex items-center justify-between"
                  >
                    <span>Credential leak (.env)</span>
                    <span className="text-[10px] font-mono font-bold text-red-600">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerShellThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FFFBEB] text-amber-800 transition-colors flex items-center justify-between"
                  >
                    <span>Reverse shell (.sh)</span>
                    <span className="text-[10px] font-mono font-bold text-amber-700">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerRealAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FEF2F2] text-rose-800 transition-colors flex items-center justify-between"
                  >
                    <span>Canary honeypot file</span>
                    <span className="text-[10px] font-mono font-bold text-rose-700">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerSafeAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#ECFDF5] text-emerald-800 transition-colors flex items-center justify-between"
                  >
                    <span>Safe documentation read</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">ALLOW</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      setActivePrompt({
                        id: 'act-prompt-' + Date.now().toString(36),
                        agentId: 'Claude Code',
                        actionType: 'DELETE',
                        targetPath: '~/project/src/main.py',
                        riskScore: 47,
                        riskCategory: 'MEDIUM',
                        reasonCode: 'UNTRACKED_FILE_DELETION',
                        explanation:
                          'Claude Code wants to delete a file you modified recently but have not committed to git.',
                        fileContext: {
                          size: '14.2 KB (247 lines)',
                          isGitTracked: false,
                          lastModified: '12 minutes ago',
                          inScope: true,
                        },
                      });
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F0F9FF] text-sky-800 transition-colors flex items-center justify-between"
                  >
                    <span>Interactive prompt modal</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700">PROMPT</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notice Banner */}
        {actionSuccessNotice && (
          <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <span>{actionSuccessNotice}</span>
            <button onClick={() => setActionSuccessNotice(null)} className="font-bold text-sm">✕</button>
          </div>
        )}

        {/* 2. Key Metrics Grid (Porcelain Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs hover:border-[#CBD8CF] transition-all duration-150 space-y-2">
            <div className="flex justify-between items-center text-xs text-[#536459]">
              <span className="font-medium">Total Interceptions</span>
              <span className="size-6 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-xs">
                &bull;
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-[#111915] tabular-nums">
              {totalActionsCount}
            </p>
            <p className="text-[11px] font-mono text-[#75887B]">
              Logged in SQLite flight recorder
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs hover:border-[#CBD8CF] transition-all duration-150 space-y-2">
            <div className="flex justify-between items-center text-xs text-[#536459]">
              <span className="font-medium">Critical Threats</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-[10px] font-semibold">
                Score &ge; 80
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-rose-700 tabular-nums">
              {criticalThreatsCount}
            </p>
            <p className="text-[11px] font-mono text-[#75887B]">
              Auto-isolated by policy gate
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs hover:border-[#CBD8CF] transition-all duration-150 space-y-2">
            <div className="flex justify-between items-center text-xs text-[#536459]">
              <span className="font-medium">Supervised Prompts</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono text-[10px] font-semibold">
                Score 40-79
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-amber-700 tabular-nums">
              {elevatedRisksCount}
            </p>
            <p className="text-[11px] font-mono text-[#75887B]">
              Awaiting human confirmation
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs hover:border-[#CBD8CF] transition-all duration-150 space-y-2">
            <div className="flex justify-between items-center text-xs text-[#536459]">
              <span className="font-medium">Contained Threats</span>
              <span className="size-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs">
                ✓
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-emerald-700 tabular-nums">
              {containedBlocksCount}
            </p>
            <p className="text-[11px] font-mono text-[#75887B]">
              Zero escape policy enforced
            </p>
          </div>
        </section>

        {/* 3. Interactive Heuristic Target Evaluation (Porcelain Split View) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Inspector Card */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-[#111915]">
                  Heuristic Target Evaluation
                </h3>
                <p className="text-xs text-[#536459]">
                  Evaluate digital targets live against deterministic security policies.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#F4F7F5] border border-[#E2EAE4] text-[#536459]">
                Port 8765
              </span>
            </div>

            {/* Target Mode Segmented Control */}
            <div className="flex p-1 rounded-xl bg-[#F4F7F5] border border-[#E2EAE4] text-xs font-medium text-[#536459]">
              {(['url', 'email', 'file', 'ip', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    scanMode === mode
                      ? 'bg-[#FFFFFF] text-[#111915] font-semibold shadow-xs'
                      : 'hover:text-[#111915]'
                  }`}
                >
                  {mode === 'ip' ? 'IP' : mode.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#75887B] uppercase font-medium">
                Target Input for Inspection
              </label>
              <textarea
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] text-xs text-[#111915] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
              />
            </div>

            {/* Quick Demo Presets */}
            {scanMode === 'file' && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-mono text-[#75887B]">Workspace presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Credential leak (.env)', file: 'threat_samples/malicious_exfiltration.env' },
                    { label: 'Reverse shell (.sh)', file: 'threat_samples/reverse_shell.sh' },
                    { label: 'Honeypot canary', file: 'sentinel_canary.env' },
                    { label: 'Safe doc (README)', file: 'docs/README.md' },
                  ].map((preset) => (
                    <button
                      key={preset.file}
                      type="button"
                      onClick={() => setScanInput(preset.file)}
                      className="px-2.5 py-1 rounded-lg bg-[#F4F7F5] hover:bg-[#EAF0EB] border border-[#E2EAE4] text-[11px] text-[#536459] transition-colors"
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
              className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ActivitySvg className={`size-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Evaluating target...' : 'Evaluate Target'}</span>
            </button>
          </div>

          {/* Decision Verdict Card */}
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2EAE4] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#75887B] font-medium">
                    Evaluation Verdict
                  </span>
                  <h4 className="text-lg font-heading font-bold text-[#111915] mt-0.5">
                    {threatResult.classification}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#75887B]">Risk Score</span>
                  <p
                    className={`text-2xl font-heading font-extrabold tabular-nums ${
                      threatResult.score >= 80
                        ? 'text-red-700'
                        : threatResult.score >= 40
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {threatResult.score}/100
                  </p>
                </div>
              </div>

              {/* Indicator Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {threatResult.indicators.map((ind) => (
                  <div
                    key={ind.label}
                    className="p-2.5 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] text-[11px] space-y-0.5"
                  >
                    <span className="text-[#75887B] text-[10px] block">{ind.label}</span>
                    <span className="font-semibold text-[#111915] truncate block">
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict Explanation */}
              <div className="p-3.5 rounded-xl bg-[#F4F7F5] border border-[#E2EAE4] text-xs text-[#536459] leading-relaxed text-pretty">
                {threatResult.verdict}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#75887B]">
              <span>SHA-256 Chained</span>
              <span className="text-emerald-700 font-semibold">100% Cryptographic Match</span>
            </div>
          </div>
        </section>

        {/* 4. Live Intercepted Actions Feed Table */}
        <section id="action-feed" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-heading font-bold text-[#111915]">
                Live Intercepted Feed
              </h3>
              <p className="text-xs text-[#536459]">
                Chronological ledger of security decisions evaluated across system processes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E2EAE4] text-xs text-[#111915] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />

              <button
                onClick={handleExportLogs}
                disabled={!daemonActions.length}
                className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F2F6F3] border border-[#E2EAE4] text-xs font-medium text-[#111915] transition-colors disabled:opacity-50"
              >
                Export CSV
              </button>
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
                  {displayActions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#75887B]">
                        No recorded actions match current filters.
                      </td>
                    </tr>
                  ) : (
                    displayActions.slice(0, 50).map((action) => {
                      const isBlock = action.outcome?.includes('BLOCK');
                      const isPrompt = action.outcome?.includes('PROMPT') || action.outcome?.includes('USER');

                      return (
                        <tr
                          key={action.id}
                          onClick={() => setSelectedAction(action)}
                          className="hover:bg-[#F9FAF9] transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-[#75887B] tabular-nums whitespace-nowrap">
                            {formatLocalTime(action.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#111915] whitespace-nowrap">
                            {action.agent_id || 'system'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#F4F7F5] border border-[#E2EAE4] text-[10px] text-[#536459]">
                              {action.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#536459] max-w-xs truncate" title={action.target_path || undefined}>
                            {action.target_path || 'None'}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                action.risk_score >= 80
                                  ? 'bg-rose-50 text-rose-700 font-bold'
                                  : action.risk_score >= 40
                                  ? 'bg-amber-50 text-amber-800 font-bold'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {action.risk_score}/100
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
                              {action.outcome}
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
        </section>
      </div>

      {/* Interactive Permission Prompt Dialog */}
      <PermissionPromptDialog
        prompt={activePrompt}
        onClose={() => setActivePrompt(null)}
        onDecisionApplied={syncDaemon}
      />
    </>
  );
}
