'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  SentinelLogoSvg,
  ActivitySvg,
  ShieldCheckSvg,
  ShieldAlertSvg,
} from '@/components/icons/SvgIcons';
import { getDaemonStatus, getAlerts, markAlertRead, DaemonStatus, DaemonAlert } from '@/lib/daemon';

export default function Navbar() {
  const [time, setTime] = useState<string>('00:00:00 IST');
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
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

  const fetchTelemetry = async () => {
    try {
      const [status, unreadAlerts] = await Promise.all([
        getDaemonStatus().catch(() => null),
        getAlerts().catch(() => []),
      ]);
      setDaemonStatus(status);
      setAlerts(unreadAlerts);
    } catch {
      // offline handled gracefully
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <header className="h-16 border-b border-[#1E2536] bg-[#0D1017] px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Breadcrumb */}
      <Link href="/" className="flex items-center gap-3.5 hover:opacity-95 transition-opacity duration-150">
        <div className="size-9 rounded-lg bg-[#131722] border border-[#00E5FF]/30 flex items-center justify-center p-1 overflow-hidden shadow-xs">
          <Image
            src="/logo.png"
            alt="SentinelAI Logo"
            width={32}
            height={32}
            className="object-cover rounded"
            priority
          />
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#8A94A6]">
            <span className="text-white font-bold tracking-wide font-heading">SentinelAI</span>
            <span>/</span>
            <span className="text-[#00E5FF] font-medium tracking-wide">SOC Command &amp; Governance</span>
          </div>
          <p className="text-[11px] text-[#8A94A6] font-medium mt-0.5">
            Autonomous agent permission broker &amp; audit plane
          </p>
        </div>
      </Link>

      {/* Real-time Status Center */}
      <div className="flex items-center gap-4">
        {/* Real-time UTC/IST Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131722] border border-[#1E2536] text-xs font-mono tabular-nums text-[#8A94A6]">
          <ActivitySvg className="size-3.5 text-[#00E5FF]" />
          <span className="text-white font-bold">{time}</span>
        </div>

        {/* Security Engine State Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131722] border border-[#1E2536] text-xs font-mono">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#8A94A6]">Mode:</span>
          <span className="text-[#00E5FF] font-bold">STRICT_INTERCEPT</span>
        </div>

        {/* Daemon Connection Pulse */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131722] border border-[#1E2536] text-xs font-mono">
          <ShieldCheckSvg className={`size-3.5 ${daemonStatus?.running ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-[#8A94A6]">Daemon:</span>
          <span className={`font-bold ${daemonStatus?.running ? 'text-emerald-400' : 'text-red-400'}`}>
            {daemonStatus?.running ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>

        {/* Security Alerts Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown((prev) => !prev)}
            aria-label="Security alerts"
            className="relative p-2 rounded-lg bg-[#131722] hover:bg-[#1A202E] border border-[#1E2536] text-[#8A94A6] hover:text-white transition-colors duration-150"
          >
            <ShieldAlertSvg className="size-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Popover Menu */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#131722] border border-[#1E2536] shadow-2xl z-50 p-3 space-y-2 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2536]">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <ShieldAlertSvg className="size-3.5 text-amber-400" />
                  Security Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-[#8A94A6]">Live feed</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-[#8A94A6] text-xs">
                    No active security alerts. System normal.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-lg bg-[#0D1017] border border-[#1E2536] space-y-1 hover:border-[#333D52] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-[11px] leading-tight">
                          {alert.title}
                        </span>
                        <button
                          onClick={(e) => handleDismissAlert(alert.id, e)}
                          aria-label="Dismiss alert"
                          className="text-[#8A94A6] hover:text-white text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-[#8A94A6] line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-[#8A94A6] pt-1">
                        <span className="text-red-400 font-bold">{alert.severity}</span>
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
