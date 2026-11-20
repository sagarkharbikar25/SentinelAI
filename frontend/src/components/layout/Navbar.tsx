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
    <header className="h-16 border-b border-line bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none shrink-0">
      {/* Route-Derived Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
        <Link href="/" className="hover:text-ink-1 transition-colors">
          SentinelAI
        </Link>
        <span>/</span>
        <span className="text-ink-1 font-semibold font-display tracking-tight text-sm">
          {currentBreadcrumb}
        </span>
      </div>

      {/* Real-time Status Center - Derived from useDaemon() */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-pill bg-well text-xs font-mono tabular-nums text-ink-2">
          <ActivitySvg className="size-3.5 text-brand" />
          <span className="text-ink-1 font-medium">{time}</span>
        </div>

        {/* Security Engine State Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-well text-xs font-mono"
          title={rawMode}
        >
          <span
            className={`size-2 rounded-pill ${
              isOnline ? 'bg-safe animate-pulse' : 'bg-ink-3'
            }`}
          />
          <span className="text-ink-3">Mode:</span>
          <span className={`font-semibold ${isOnline ? 'text-brand-ink' : 'text-ink-3'}`}>
            {isOnline ? mode : 'Offline'}
          </span>
        </div>

        {/* Daemon Connection Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-colors ${
            isOnline
              ? 'bg-safe-soft text-safe-ink'
              : status === 'connecting'
              ? 'bg-caution-soft text-caution-ink'
              : 'bg-critical-soft text-critical-ink'
          }`}
        >
          <ShieldCheckSvg
            className={`size-3.5 ${
              isOnline ? 'text-safe-ink' : status === 'connecting' ? 'text-caution-ink' : 'text-critical-ink'
            }`}
          />
          <span className="opacity-80">Daemon:</span>
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

        {/* Security Alerts Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown((prev) => !prev)}
            aria-label={`Security alerts, ${alerts.length} unread`}
            className="relative p-2 rounded-pill bg-well hover:bg-well/80 text-ink-2 hover:text-ink-1 transition-colors duration-150"
          >
            <ShieldAlertSvg className="size-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-critical-soft text-critical-ink border border-critical/30 font-mono text-[9px] font-bold rounded-pill flex items-center justify-center">
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
