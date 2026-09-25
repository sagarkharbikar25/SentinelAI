'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Shield, Bell, Terminal, Activity, Clock, CheckCircle2, AlertTriangle, X, ExternalLink } from 'lucide-react';
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
    <header className="h-16 border-b border-[#3F4850]/40 bg-[#0A0E17]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xl select-none">
      {/* Brand & Breadcrumb */}
      <Link href="/" className="flex items-center gap-4 hover:opacity-95 transition">
        {/* Authentic SOC Emblem Icon */}
        <div className="w-10 h-10 rounded-lg bg-[#181B25] border border-[#93CCFF]/40 flex items-center justify-center text-[#93CCFF] shadow-md shadow-[#93CCFF]/10">
          <Shield className="w-5 h-5 text-[#93CCFF]" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#89929B]">
            <Terminal className="w-3.5 h-3.5 text-[#93CCFF]" />
            <span className="text-white font-bold tracking-wider">SENTINEL AI</span>
            <span>/</span>
            <span className="text-[#93CCFF] font-semibold tracking-wide">SOC COMMAND &amp; GOVERNANCE</span>
          </div>
          <p className="text-[11px] text-[#BFC7D2] font-medium mt-0.5">
            National Threat Detection &amp; Autonomous Agent Runtime Interceptor
          </p>
        </div>
      </Link>

      {/* Right Controls: Telemetry Clock, Daemon Status, Notification Bell */}
      <div className="flex items-center gap-3.5 font-mono text-xs">
        {/* Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181B25] border border-[#3F4850]/40 text-[#DFE2F0]">
          <Clock className="w-3.5 h-3.5 text-[#93CCFF]" />
          <span className="text-[11px] font-semibold">{time}</span>
        </div>

        {/* Dynamic Daemon Status Pill */}
        <button
          onClick={fetchTelemetry}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold shadow-sm transition ${
            daemonStatus?.running
              ? 'bg-[#181B25] border-[#4EDEA3]/30 text-[#4EDEA3] hover:border-[#4EDEA3]/60'
              : 'bg-red-500/10 border-red-500/40 text-[#FF5449] hover:bg-red-500/20'
          }`}
          title="Click to re-ping daemon"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              daemonStatus?.running ? 'bg-[#4EDEA3] animate-pulse shadow-sm shadow-[#4EDEA3]' : 'bg-[#FF5449]'
            }`}
          />
          {daemonStatus?.running ? 'DAEMON: ONLINE (:8765)' : 'DAEMON: OFFLINE (RETRY)'}
        </button>

        {/* Interactive Notification Bell with Badge & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown((prev) => !prev)}
            className={`p-2 rounded-lg border transition relative ${
              showAlertsDropdown
                ? 'bg-[#181B25] text-white border-[#93CCFF]/50'
                : 'text-[#89929B] hover:text-white hover:bg-[#181B25] border-transparent hover:border-[#3F4850]/40'
            }`}
            title="View Security Alerts"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5449] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Modal */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#141824] border border-[#3F4850] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FFB95F]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Unread Alerts ({alerts.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowAlertsDropdown(false)}
                  className="p-1 rounded hover:bg-[#1C1F29] text-[#89929B] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#3F4850]/30 font-sans">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#89929B] space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-[#4EDEA3] mx-auto opacity-70" />
                    <p className="font-semibold text-white">All Clear</p>
                    <p>No active unread alerts from the daemon.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 hover:bg-[#181B25]/80 transition flex items-start justify-between gap-2.5"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold border ${
                              alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                                ? 'bg-red-500/15 text-[#FF5449] border-red-500/30'
                                : 'bg-amber-500/15 text-[#FFB95F] border-amber-500/30'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-[#89929B]">
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-semibold text-white leading-snug">{alert.title}</p>
                        <p className="text-[#BFC7D2] text-[11px] leading-relaxed line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDismissAlert(alert.id, e)}
                        className="text-[10px] text-[#93CCFF] hover:underline font-mono whitespace-nowrap self-start mt-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 bg-[#0A0E17] border-t border-[#3F4850]/40 flex justify-between items-center text-xs font-mono">
                <Link
                  href="/security"
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-[11px] text-[#93CCFF] hover:underline flex items-center gap-1"
                >
                  Open Threat Center <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={fetchTelemetry}
                  className="text-[11px] text-[#89929B] hover:text-white"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
