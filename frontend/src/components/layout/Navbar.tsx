'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivitySvg,
  ShieldCheckSvg,
  ShieldAlertSvg,
  HomeSvg,
  VaultSvg,
  AuditSvg,
  LabSvg,
  SettingsSvg,
} from '@/components/icons/SvgIcons';
import { getAlerts, markAlertRead, DaemonAlert } from '@/lib/daemon';
import { useDaemon } from '@/context/DaemonContext';
import { formatLocalTime } from '@/lib/dateUtils';
import { useNavigationLoader } from '@/context/NavigationContext';

const routeConfig: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  '/': { title: 'Home', subtitle: 'Runtime Governance & Overview', icon: HomeSvg },
  '/vault': { title: 'Backup vault', subtitle: 'Shadow File Recovery & Archives', icon: VaultSvg },
  '/audit-logs': { title: 'Log & audit', subtitle: 'SHA-256 Chained Telemetry', icon: AuditSvg },
  '/lab': { title: 'Test lab', subtitle: 'Deterministic Attack Simulation', icon: LabSvg },
  '/settings': { title: 'Settings', subtitle: 'System & Theme Configuration', icon: SettingsSvg },
};

export default function Navbar() {
  const pathname = usePathname();
  const currentRoute = routeConfig[pathname] || { title: 'Overview', subtitle: 'Security Plane', icon: HomeSvg };
  const RouteIcon = currentRoute.icon;

  const { status, latencyMs, mode, rawMode, dbConnected, canaryCount, lastSeenAt, refresh: refreshDaemon } = useDaemon();
  const { startNavigation } = useNavigationLoader();

  const [time, setTime] = useState<string>('00:00:00 IST');
  const [alerts, setAlerts] = useState<DaemonAlert[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const diagnosticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    if (status !== 'online') return;
    try {
      const unreadAlerts = await getAlerts().catch(() => []);
      setAlerts(unreadAlerts);
    } catch {
      // offline handled gracefully
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [status]);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAlertsDropdown(false);
      }
      if (diagnosticsRef.current && !diagnosticsRef.current.contains(event.target as Node)) {
        setShowDiagnostics(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAlertRead(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const isOnline = status === 'online';

  return (
    <header className="h-16 border-b border-line bg-surface/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none shrink-0 shadow-xs">
      {/* Route-Derived Breadcrumb with Visual Context */}
      <div className="flex items-center gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-xs">
          <Link
            href="/"
            onClick={() => {
              if (pathname !== '/') startNavigation('/');
            }}
            className="flex items-center gap-1.5 text-ink-3 hover:text-ink-1 transition-colors font-medium"
          >
            <span className="size-2 rounded-full bg-brand" />
            <span>SentinelAI</span>
          </Link>
          <span className="text-line-strong select-none">/</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-well/80 border border-line/60">
            <RouteIcon className="size-3 text-brand" />
            <span className="text-ink-1 font-semibold font-display tracking-tight text-xs">
              {currentRoute.title}
            </span>
          </div>
        </nav>
        <span className="hidden xl:inline-block text-[11px] text-ink-3 font-mono">
          — {currentRoute.subtitle}
        </span>
      </div>

      {/* Real-time Status Center - Derived from useDaemon() */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Real-time Clock */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-pill bg-well text-xs font-mono tabular-nums text-ink-2 border border-line/40"
          title="System Local Telemetry Clock"
        >
          <ActivitySvg className="size-3.5 text-brand shrink-0" />
          <span className="text-ink-1 font-medium">{time}</span>
        </div>

        {/* Security Engine State Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-well text-xs font-mono border border-line/40"
          title={`Interception Policy: ${rawMode}`}
        >
          <span
            className={`size-2 rounded-pill shrink-0 ${
              isOnline ? 'bg-safe animate-pulse' : 'bg-ink-3'
            }`}
          />
          <span className="text-ink-3 hidden sm:inline">Mode:</span>
          <span
            className={`font-semibold ${
              isOnline ? 'text-brand-ink' : 'text-ink-3'
            }`}
          >
            {isOnline ? mode : 'Standby'}
          </span>
        </div>

        {/* Daemon Connection Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-colors border ${
            isOnline
              ? 'bg-safe-soft text-safe-ink border-safe/20'
              : status === 'connecting'
              ? 'bg-caution-soft text-caution-ink border-caution/20'
              : 'bg-critical-soft text-critical-ink border-critical/20'
          }`}
          title={isOnline ? 'FastAPI daemon active on port 8765' : 'Daemon unreachable'}
        >
          <ShieldCheckSvg
            className={`size-3.5 shrink-0 ${
              isOnline
                ? 'text-safe-ink'
                : status === 'connecting'
                ? 'text-caution-ink'
                : 'text-critical-ink'
            }`}
          />
          <span className="opacity-80 hidden sm:inline">Daemon:</span>
          <span className="font-bold">
            {isOnline
              ? latencyMs !== null
                ? `Online (${latencyMs}ms)`
                : 'Online'
              : status === 'connecting'
              ? 'Connecting'
              : 'Offline'}
          </span>
        </div>

        {/* Quick Diagnostics Popover Trigger */}
        <div className="relative" ref={diagnosticsRef}>
          <button
            onClick={() => {
              setShowDiagnostics((prev) => !prev);
              setShowAlertsDropdown(false);
            }}
            aria-label="View system diagnostics and daemon state"
            title="System Diagnostics"
            className="p-2 rounded-pill bg-well hover:bg-well/80 border border-line/40 text-ink-2 hover:text-ink-1 transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </button>

          {/* Diagnostics Popover Menu */}
          {showDiagnostics && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-card bg-surface border border-line shadow-card z-50 p-4 space-y-3 font-mono text-xs animate-in fade-in zoom-in-95 duration-100"
              role="dialog"
              aria-label="System Diagnostics Panel"
            >
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-ink-1 font-bold font-display text-sm flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand" />
                  Runtime Diagnostics
                </span>
                <button
                  onClick={() => refreshDaemon()}
                  title="Ping daemon now"
                  className="text-[10px] text-brand hover:text-brand-hover font-bold px-2 py-0.5 rounded-pill bg-brand-soft"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-line/40">
                  <span className="text-ink-3">Daemon Endpoint</span>
                  <span className="text-ink-1 font-semibold">127.0.0.1:8765</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-line/40">
                  <span className="text-ink-3">SQLite Ledger</span>
                  <span className={`font-semibold ${dbConnected ? 'text-safe-ink' : 'text-critical-ink'}`}>
                    {dbConnected ? 'Connected' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-line/40">
                  <span className="text-ink-3">Honeytoken Traps</span>
                  <span className="text-ink-1 font-semibold">
                    {canaryCount > 0 ? `${canaryCount} armed` : 'Standby'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-line/40">
                  <span className="text-ink-3">Round-Trip Latency</span>
                  <span className="text-ink-1 font-semibold">
                    {latencyMs !== null ? `${latencyMs}ms` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-ink-3">Last Heartbeat</span>
                  <span className="text-ink-2 text-[10px]">
                    {lastSeenAt ? formatLocalTime(lastSeenAt.toISOString()) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Alerts Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowAlertsDropdown((prev) => !prev);
              setShowDiagnostics(false);
            }}
            aria-label={`Security alerts, ${alerts.length} unread`}
            title={`Security alerts (${alerts.length})`}
            className="relative p-2 rounded-pill bg-well hover:bg-well/80 border border-line/40 text-ink-2 hover:text-ink-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ShieldAlertSvg className="size-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-critical-soft text-critical-ink border border-critical/30 font-mono text-[9px] font-bold rounded-pill flex items-center justify-center animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Popover Menu */}
          {showAlertsDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-card bg-surface border border-line shadow-card z-50 p-4 space-y-2.5 font-mono text-xs animate-in fade-in zoom-in-95 duration-100"
              role="dialog"
              aria-label="Security Alerts Feed"
            >
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-ink-1 font-bold flex items-center gap-1.5 font-display text-sm">
                  <ShieldAlertSvg className="size-3.5 text-caution-ink" />
                  Security Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-ink-3">Live feed</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-ink-3 text-xs">
                    {isOnline ? 'No active security alerts. System normal.' : 'Daemon offline. Alerts unavailable.'}
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-well bg-well space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink-1 text-[11px] leading-tight">
                          {alert.title}
                        </span>
                        <button
                          onClick={(e) => handleDismissAlert(alert.id, e)}
                          aria-label={`Dismiss alert ${alert.title}`}
                          className="text-ink-3 hover:text-ink-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-ink-2 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-ink-3 pt-1">
                        <span className="px-2 py-0.5 rounded-pill bg-critical-soft text-critical-ink font-bold">
                          {alert.severity}
                        </span>
                        <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
