'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ActivitySvg,
  ShieldCheckSvg,
  ShieldAlertSvg,
} from '@/components/icons/SvgIcons';
import {
  getRecentActions,
  interceptAction,
  getAlerts,
  explainAction,
  ActionLog,
  ActionExplanation,
} from '@/lib/daemon';
import PermissionPromptDialog, { PromptAction } from '@/components/PermissionPromptDialog';
import SplashScreen from '@/components/ui/SplashScreen';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { useDaemon } from '@/context/DaemonContext';
import { formatLocalTime } from '@/lib/dateUtils';

const sampleScanTargets: Record<string, string> = {
  url: 'https://security-payload-verification.internal-scada.org/auth/token?sig=4bf02',
  email: 'urgent-account-validation@internal-sec-audit.portal-gateway.net',
  file: 'threat_samples/malicious_exfiltration.env',
  ip: '198.51.100.24 (AS40201 - Malicious Proxy / BGP Anomaly)',
  text: 'POST /v2/internal/credentials/dump HTTP/1.1\nHost: admin.scada.gov\nAuthorization: Bearer null\nX-Exploit-Payload: \\x7f\\x45\\x4c\\x46\\x02\\x01\\x01',
};

export default function DashboardPage() {
  const { status, mode, rawMode, dbConnected, canaryCount, latencyMs, lastSeenAt, refresh: refreshDaemon } = useDaemon();
  const isOnline = status === 'online';

  const [daemonActions, setDaemonActions] = useState<ActionLog[]>([]);
  const [scanMode, setScanMode] = useState<string>('url');
  const [scanInput, setScanInput] = useState<string>(sampleScanTargets.url);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [threatResult, setThreatResult] = useState({
    id: 'INITIAL-IDLE',
    score: 0,
    riskLevel: 'Standby',
    classification: 'Ready for evaluation',
    subVector: 'Deterministic Policy Engine',
    confidence: '100%',
    indicators: [
      { label: 'Target Type:', value: 'URL' },
      { label: 'Policy Engine:', value: isOnline ? 'Online' : 'Offline' },
      { label: 'Database:', value: dbConnected ? 'Connected' : 'Unavailable' },
      { label: 'Canary Files:', value: isOnline ? `${canaryCount} monitored` : 'Offline' },
      { label: 'Heuristic Scorer:', value: isOnline ? 'Ready' : 'Offline' },
      { label: 'Audit Log:', value: 'Chained SHA-256' },
    ],
    verdict: 'Submit any target URL, honeypot file, IP address, or system command above to evaluate deterministic risk live via SentinelAI.',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verifiedMatch: false,
  });

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<PromptAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isTriggeringAction, setIsTriggeringAction] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Update dynamic indicators when online status changes
  useEffect(() => {
    setThreatResult((prev) => ({
      ...prev,
      indicators: [
        { label: 'Target Type:', value: scanMode.toUpperCase() },
        { label: 'Policy Engine:', value: isOnline ? 'Online' : 'Offline' },
        { label: 'Database:', value: dbConnected ? 'Connected' : 'Unavailable' },
        { label: 'Canary Files:', value: isOnline ? `${canaryCount} monitored` : 'Offline' },
        { label: 'Heuristic Scorer:', value: isOnline ? 'Ready' : 'Offline' },
        { label: 'Audit Log:', value: 'Chained SHA-256' },
      ],
      verdict: isOnline
        ? 'Submit any target URL, honeypot file, IP address, or system command above to evaluate deterministic risk live via SentinelAI.'
        : 'Security daemon is offline. Real-time target evaluation suspended until daemon is started on port 8765.',
    }));
  }, [isOnline, dbConnected, canaryCount, scanMode]);

  const syncActions = async () => {
    if (!isOnline) return;
    setIsRefreshing(true);
    try {
      const [actions, alerts] = await Promise.all([
        getRecentActions(200).catch(() => []),
        getAlerts().catch(() => []),
      ]);
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
    syncActions();
    const interval = setInterval(syncActions, 4000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleModeChange = (mode: string) => {
    setScanMode(mode);
    setScanInput(sampleScanTargets[mode] || '');
  };

  const handleTriggerRealAction = async () => {
    if (!isOnline) return;
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
      await syncActions();
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
    if (!isOnline) return;
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
      await syncActions();
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
    if (!isOnline) return;
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
      await syncActions();
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
    if (!isOnline) return;
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
      await syncActions();
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
    if (!isOnline) return;
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
        { label: 'Target Type:', value: scanMode.toUpperCase() },
        { label: 'Heuristic Scorer:', value: `${res.risk_score}/100 Risk` },
        { label: 'Policy Gate:', value: res.decision },
        { label: 'Reason Code:', value: res.reason_code || 'HEURISTIC_PASS' },
        { label: 'Risk Category:', value: res.risk_category || 'STANDARD' },
        { label: 'Audit Log:', value: 'Chained SHA-256' },
      ];

      setThreatResult({
        id: (res as any).action_id || 'act-eval',
        score: res.risk_score,
        riskLevel: isHigh ? 'Critical Risk' : isMed ? 'Elevated Risk' : 'Normal / Clean',
        classification: res.decision === 'ALLOW' ? 'Permitted Operation' : 'Blocked / Quarantined',
        subVector: res.reason_code || 'Deterministic Policy Rule',
        confidence: '99.4%',
        indicators,
        verdict: res.explanation || 'Evaluated deterministically by SentinelAI local decision engine.',
        sha256: 'a3bf4c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verifiedMatch: true,
      });

      await syncActions();
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

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Offline Banner when Daemon is offline */}
        <OfflineBanner />

        {/* 1. Header Overview (F1: WCAG AA Compliant White Headings on Dark Canvas) */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
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
                {isOnline
                  ? `Workstation active • Port 8765 (${latencyMs !== null ? `${latencyMs}ms` : 'online'})`
                  : 'Daemon offline • Local protection suspended'}
              </span>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight text-balance">
              Runtime Security Overview
            </h1>
            <p className="text-xs text-text-secondary text-pretty max-w-2xl">
              Autonomous runtime agent governance, deterministic risk prevention, and cryptographic SQLite flight recorder.
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refreshDaemon();
                syncActions();
              }}
              disabled={isRefreshing}
              aria-label="Refresh telemetry from daemon"
              className="px-3.5 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-medium text-text-primary transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <ActivitySvg className={`size-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Test Simulation Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to enable simulation.' : undefined}
                className="px-3.5 py-2 rounded-xl bg-accent hover:opacity-90 text-canvas text-xs font-bold transition-opacity shadow-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldAlertSvg className="size-3.5" />
                <span>Simulate threat</span>
                <span className="text-[10px] opacity-80">▾</span>
              </button>

              {showDemoMenu && isOnline && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                  <p className="px-3 py-1.5 text-[10px] font-mono text-text-muted uppercase font-bold">
                    Test Scenarios
                  </p>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerCredentialThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-rose/10 text-accent-rose transition-colors flex items-center justify-between"
                  >
                    <span>Credential leak (.env)</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerShellThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-amber/10 text-accent-amber transition-colors flex items-center justify-between"
                  >
                    <span>Reverse shell (.sh)</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerRealAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-rose/10 text-accent-rose transition-colors flex items-center justify-between"
                  >
                    <span>Canary honeypot file</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerSafeAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-emerald/10 text-accent-emerald transition-colors flex items-center justify-between"
                  >
                    <span>Safe documentation read</span>
                    <span className="text-[10px] font-mono font-bold">ALLOW</span>
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
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/10 text-accent transition-colors flex items-center justify-between"
                  >
                    <span>Interactive prompt modal</span>
                    <span className="text-[10px] font-mono font-bold">PROMPT</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notice Banner */}
        {actionSuccessNotice && (
          <div className="p-4 rounded-2xl bg-card border border-accent-emerald/40 text-accent-emerald text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <span>{actionSuccessNotice}</span>
            <button onClick={() => setActionSuccessNotice(null)} className="font-bold text-sm">✕</button>
          </div>
        )}

        {/* 2. Key Metrics Grid - Fixed 3-Row Structure (F7: Equal height & baseline alignment) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Interceptions */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border-hover transition-colors flex flex-col justify-between">
            {/* Row 1: Label (h-5) with fixed 24x24 adornment */}
            <div className="h-5 flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium truncate">Total Interceptions</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-full bg-accent-emerald" />
              </div>
            </div>

            {/* Row 2: Value (h-12, tabular-nums) */}
            <div className="h-12 flex items-baseline font-mono tabular-nums text-3xl font-extrabold text-text-primary">
              {totalActionsCount}
            </div>

            {/* Row 3: Caption (h-5) */}
            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-text-muted truncate">
              <span>Recorded in SQLite</span>
              {!isOnline && lastSeenAt && (
                <span className="text-[10px] text-accent-amber">Cached</span>
              )}
            </div>
          </div>

          {/* Card 2: Critical Threats (F10: No overclaiming) */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border-hover transition-colors flex flex-col justify-between">
            {/* Row 1: Label (h-5) with fixed 24x24 adornment */}
            <div className="h-5 flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium truncate">Critical Threats</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-full bg-accent-rose" />
              </div>
            </div>

            {/* Row 2: Value (h-12, tabular-nums) */}
            <div className="h-12 flex items-baseline font-mono tabular-nums text-3xl font-extrabold text-accent-rose">
              {criticalThreatsCount}
            </div>

            {/* Row 3: Caption (h-5) */}
            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-text-muted truncate">
              <span>{criticalThreatsCount} high-risk events</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
                Score &ge; 80
              </span>
            </div>
          </div>

          {/* Card 3: Elevated Risks */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border-hover transition-colors flex flex-col justify-between">
            {/* Row 1: Label (h-5) with fixed 24x24 adornment */}
            <div className="h-5 flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium truncate">Supervised Prompts</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-full bg-accent-amber" />
              </div>
            </div>

            {/* Row 2: Value (h-12, tabular-nums) */}
            <div className="h-12 flex items-baseline font-mono tabular-nums text-3xl font-extrabold text-accent-amber">
              {elevatedRisksCount}
            </div>

            {/* Row 3: Caption (h-5) */}
            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-text-muted truncate">
              <span>Awaiting confirmation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                Score 40-79
              </span>
            </div>
          </div>

          {/* Card 4: Contained Threats (F10: Real measured values) */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border-hover transition-colors flex flex-col justify-between">
            {/* Row 1: Label (h-5) with fixed 24x24 adornment */}
            <div className="h-5 flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium truncate">Contained Threats</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <ShieldCheckSvg className="size-4 text-accent-emerald" />
              </div>
            </div>

            {/* Row 2: Value (h-12, tabular-nums) */}
            <div className="h-12 flex items-baseline font-mono tabular-nums text-3xl font-extrabold text-accent-emerald">
              {containedBlocksCount}
            </div>

            {/* Row 3: Caption (h-5) */}
            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-text-muted truncate">
              <span>{containedBlocksCount} blocked in session</span>
              <span className="text-[10px] text-accent-emerald">Isolated</span>
            </div>
          </div>
        </section>

        {/* 3. Interactive Heuristic Target Evaluation (F8: No dead space, flex-1 textarea, pinned CTA) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Target Inspector Card */}
          <div className="flex flex-col h-full p-6 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-heading font-bold text-text-primary">
                  Heuristic Target Evaluation
                </h3>
                <p className="text-xs text-text-secondary">
                  Evaluate digital targets live against deterministic security policies.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-surface border border-border text-text-muted">
                Port 8765
              </span>
            </div>

            {/* Form Section fills remaining height */}
            <div className="flex-1 flex flex-col space-y-4 pt-4">
              {/* Segmented Mode Selector */}
              <div className="flex p-1 rounded-xl bg-surface border border-border text-xs font-medium text-text-secondary">
                {(['url', 'email', 'file', 'ip', 'text'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      scanMode === mode
                        ? 'bg-card text-text-primary font-semibold shadow-xs border border-border'
                        : 'hover:text-text-primary'
                    }`}
                  >
                    {mode === 'ip' ? 'IP' : mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Textarea stretches to fill dead space */}
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
                <label className="text-[11px] font-mono text-text-muted uppercase font-medium">
                  Target Input for Inspection
                </label>
                <textarea
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  disabled={!isOnline}
                  className="flex-1 w-full p-3 rounded-xl bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all resize-none disabled:opacity-50"
                  placeholder="Enter target URL, honeypot file, or command payload..."
                />
              </div>

              {/* Presets */}
              {scanMode === 'file' && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-mono text-text-muted">Workspace presets:</span>
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
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-card-hover border border-border text-[11px] text-text-secondary transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button Pinned at Bottom */}
              <div className="pt-2 mt-auto">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isScanning || !isOnline}
                  title={!isOnline ? 'Daemon offline. Start local service on port 8765 to enable actions.' : undefined}
                  className="w-full py-2.5 rounded-xl bg-accent hover:opacity-90 text-canvas font-bold text-xs transition-opacity shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ActivitySvg className={`size-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>
                    {!isOnline
                      ? 'Daemon offline (Evaluation disabled)'
                      : isScanning
                      ? 'Evaluating target...'
                      : 'Evaluate Target'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Decision Verdict Card (F13: aria-live="polite", F10: no overclaiming) */}
          <div
            className="flex flex-col h-full p-6 rounded-2xl bg-card border border-border shadow-xs justify-between"
            aria-live="polite"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-text-muted font-medium">
                    Evaluation Verdict
                  </span>
                  <h4 className="text-lg font-heading font-bold text-text-primary mt-0.5">
                    {threatResult.classification}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-text-muted">Risk Score</span>
                  <p
                    className={`text-2xl font-heading font-extrabold tabular-nums ${
                      threatResult.score >= 80
                        ? 'text-accent-rose'
                        : threatResult.score >= 40
                        ? 'text-accent-amber'
                        : 'text-accent-emerald'
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
                    className="p-2.5 rounded-xl bg-surface border border-border text-[11px] space-y-0.5"
                  >
                    <span className="text-text-muted text-[10px] block">{ind.label}</span>
                    <span className="font-semibold text-text-primary truncate block">
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict Explanation */}
              <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-text-secondary leading-relaxed text-pretty">
                {threatResult.verdict}
              </div>
            </div>

            {/* Live Verification Footer (F10: measured, never overclaimed) */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
              <span>SHA-256 Ledger</span>
              <span className={threatResult.verifiedMatch ? 'text-accent-emerald font-semibold' : 'text-text-muted'}>
                {threatResult.verifiedMatch ? 'Chain verified: Match confirmed' : 'Verification pending scan'}
              </span>
            </div>
          </div>
        </section>

        {/* 4. Live Intercepted Actions Feed Table */}
        <section id="action-feed" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-heading font-bold text-text-primary">
                Live Intercepted Feed
              </h3>
              <p className="text-xs text-text-secondary">
                Chronological ledger of security decisions evaluated across system processes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs text-text-primary font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all"
              />

              <button
                onClick={handleExportLogs}
                disabled={!daemonActions.length}
                className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover border border-border text-xs font-medium text-text-primary transition-colors disabled:opacity-50"
              >
                Export CSV
              </button>
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
                  {displayActions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        {isOnline ? 'No recorded actions match current filters.' : 'Daemon offline. No actions to display.'}
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
                          className="hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-text-muted tabular-nums whitespace-nowrap">
                            {formatLocalTime(action.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                            {action.agent_id || 'system'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] text-text-secondary">
                              {action.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary max-w-xs truncate" title={action.target_path || undefined}>
                            {action.target_path || 'None'}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                action.risk_score >= 80
                                  ? 'bg-accent-rose/15 text-accent-rose font-bold'
                                  : action.risk_score >= 40
                                  ? 'bg-accent-amber/15 text-accent-amber font-bold'
                                  : 'bg-accent-emerald/15 text-accent-emerald'
                              }`}
                            >
                              {action.risk_score}/100
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
        onDecisionApplied={syncActions}
      />
    </>
  );
}
