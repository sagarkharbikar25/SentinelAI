'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivitySvg,
  ShieldCheckSvg,
  ShieldAlertSvg,
} from '@/components/icons/SvgIcons';
import { getAlerts, markAlertRead, DaemonAlert } from '@/lib/daemon';
import { useDaemon } from '@/context/DaemonContext';

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/vault': 'Backup vault',
  '/audit-logs': 'Log & audit',
  '/lab': 'Test lab',
  '/settings': 'Settings',
  '/policies': 'Policies',
  '/agents': 'Agents',
  '/coverage': 'Coverage',
  '/tools': 'Tools',
};

export default function Navbar() {
  const pathname = usePathname();
  const currentBreadcrumb = routeNames[pathname] || 'Overview';
  const { status, latencyMs, mode, rawMode } = useDaemon();

  const [time, setTime] = useState<string>('00:00:00 IST');
  const [alerts, setAlerts] = useState<DaemonAlert[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAlertsDropdown(false);
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
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-40 select-none shrink-0">
      {/* Route-Derived Breadcrumb (No duplicate logo) */}
      <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
        <Link href="/" className="hover:text-text-primary transition-colors">
          SentinelAI
        </Link>
        <span>/</span>
        <span className="text-text-primary font-semibold font-heading tracking-normal">
          {currentBreadcrumb}
        </span>
      </div>

      {/* Real-time Status Center - Strictly derived from useDaemon() */}
      <div className="flex items-center gap-3">
        {/* Real-time UTC/IST Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono tabular-nums text-text-secondary">
          <ActivitySvg className="size-3.5 text-accent" />
          <span className="text-text-primary font-medium">{time}</span>
        </div>

        {/* Security Engine State Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono"
          title={rawMode}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline ? 'bg-accent-emerald animate-pulse' : 'bg-text-muted'
            }`}
          />
          <span className="text-text-muted">Mode:</span>
          <span className={`font-semibold ${isOnline ? 'text-accent' : 'text-text-muted'}`}>
            {isOnline ? mode : 'Offline'}
          </span>
        </div>

        {/* Daemon Connection Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono">
          <ShieldCheckSvg
            className={`size-3.5 ${
              isOnline ? 'text-accent-emerald' : status === 'connecting' ? 'text-accent-amber' : 'text-accent-rose'
            }`}
          />
          <span className="text-text-muted">Daemon:</span>
          <span
            className={`font-semibold ${
              isOnline ? 'text-accent-emerald' : status === 'connecting' ? 'text-accent-amber' : 'text-accent-rose'
            }`}
          >
            {isOnline ? (latencyMs !== null ? `Online (${latencyMs}ms)` : 'Online') : status === 'connecting' ? 'Connecting' : 'Offline'}
          </span>
        </div>

        {/* Security Alerts Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown((prev) => !prev)}
            aria-label={`Security alerts, ${alerts.length} unread`}
            className="relative p-2 rounded-lg bg-card hover:bg-card-hover border border-border text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            <ShieldAlertSvg className="size-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-accent-rose text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Popover Menu */}
          {showAlertsDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl z-50 p-3.5 space-y-2 font-mono text-xs animate-in fade-in zoom-in-95 duration-100"
              role="dialog"
              aria-label="Security Alerts Feed"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-text-primary font-bold flex items-center gap-1.5 font-heading">
                  <ShieldAlertSvg className="size-3.5 text-accent-amber" />
                  Security Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-text-muted">Live feed</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-text-muted text-xs">
                    {isOnline ? 'No active security alerts. System normal.' : 'Daemon offline. Alerts unavailable.'}
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-xl bg-surface border border-border space-y-1 hover:border-border-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-text-primary text-[11px] leading-tight">
                          {alert.title}
                        </span>
                        <button
                          onClick={(e) => handleDismissAlert(alert.id, e)}
                          aria-label={`Dismiss alert ${alert.title}`}
                          className="text-text-muted hover:text-text-primary text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-text-secondary line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-text-muted pt-1">
                        <span className="text-accent-rose font-bold">{alert.severity}</span>
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
