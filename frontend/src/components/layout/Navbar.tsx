'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
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
    <header className="h-16 border-b border-[#E2EAE4] bg-[#FFFFFF] px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Breadcrumb */}
      <Link href="/" className="flex items-center gap-3.5 hover:opacity-95 transition-opacity duration-150">
        <div className="size-9 rounded-xl bg-[#F4F7F5] border border-[#D1DDD5] flex items-center justify-center p-1 overflow-hidden shadow-xs">
          <Image
            src="/logo.png"
            alt="SentinelAI Logo"
            width={32}
            height={32}
            className="object-cover rounded-lg"
            priority
          />
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#536459]">
            <span className="text-[#111915] font-bold tracking-tight font-heading">SentinelAI</span>
            <span>/</span>
            <span className="text-[#059669] font-medium tracking-normal">Runtime Governance &amp; Audit</span>
          </div>
          <p className="text-[11px] text-[#75887B] font-medium">
            Local autonomous security daemon
          </p>
        </div>
      </Link>

      {/* Real-time Status Center */}
      <div className="flex items-center gap-3">
        {/* Real-time UTC/IST Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F7F5] border border-[#E2EAE4] text-xs font-mono tabular-nums text-[#536459]">
          <ActivitySvg className="size-3.5 text-[#059669]" />
          <span className="text-[#111915] font-semibold">{time}</span>
        </div>

        {/* Security Engine State Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-mono">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#065F46] font-medium">Mode:</span>
          <span className="text-[#064E3B] font-bold">STRICT_INTERCEPT</span>
        </div>

        {/* Daemon Connection Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F7F5] border border-[#E2EAE4] text-xs font-mono">
          <ShieldCheckSvg className={`size-3.5 ${daemonStatus?.running ? 'text-emerald-600' : 'text-zinc-400'}`} />
          <span className="text-[#536459]">Daemon:</span>
          <span className={`font-semibold ${daemonStatus?.running ? 'text-emerald-700' : 'text-zinc-500'}`}>
            {daemonStatus?.running ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>

        {/* Security Alerts Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown((prev) => !prev)}
            aria-label="Security alerts"
            className="relative p-2 rounded-lg bg-[#F4F7F5] hover:bg-[#EAF0EB] border border-[#E2EAE4] text-[#536459] hover:text-[#111915] transition-colors duration-150"
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
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xl z-50 p-3.5 space-y-2 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2EAE4]">
                <span className="text-[#111915] font-bold flex items-center gap-1.5 font-heading">
                  <ShieldAlertSvg className="size-3.5 text-amber-600" />
                  Security Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-[#75887B]">Live feed</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-[#75887B] text-xs">
                    No active security alerts. All systems secure.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] space-y-1 hover:border-[#CBD8CF] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[#111915] text-[11px] leading-tight">
                          {alert.title}
                        </span>
                        <button
                          onClick={(e) => handleDismissAlert(alert.id, e)}
                          aria-label="Dismiss alert"
                          className="text-[#75887B] hover:text-[#111915] text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-[#536459] line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-[#75887B] pt-1">
                        <span className="text-red-700 font-bold">{alert.severity}</span>
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
