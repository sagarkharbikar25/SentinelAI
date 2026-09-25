'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Wrench,
  ShieldAlert,
  FileText,
  Activity,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getDaemonStatus, DaemonStatus } from '@/lib/daemon';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OPERATIONAL RUNTIME',
    items: [
      {
        name: 'SOC Dashboard',
        href: '/',
        icon: LayoutDashboard,
        badge: 'LIVE',
        badgeColor: 'bg-emerald-500/10 text-[#4EDEA3] border-[#4EDEA3]/30',
      },
      {
        name: 'Agent Interceptor',
        href: '/agents',
        icon: Bot,
        badge: 'ACTIVE',
        badgeColor: 'bg-blue-500/10 text-[#93CCFF] border-[#93CCFF]/30',
      },
      {
        name: 'Security Threat Center',
        href: '/security',
        icon: Activity,
        badge: 'REALTIME',
        badgeColor: 'bg-amber-500/10 text-[#FFB95F] border-[#FFB95F]/30',
      },
    ],
  },
  {
    title: 'GOVERNANCE & AUDIT',
    items: [
      {
        name: 'Governance Policies',
        href: '/policies',
        icon: ShieldAlert,
        badge: 'RULES',
        badgeColor: 'bg-[#1C1F29] text-[#DFE2F0] border-[#3F4850]/60',
      },
      {
        name: 'Tools Registry',
        href: '/tools',
        icon: Wrench,
        badge: 'MANIFEST',
        badgeColor: 'bg-[#1C1F29] text-[#DFE2F0] border-[#3F4850]/60',
      },
      {
        name: 'Audit Flight Recorder',
        href: '/audit-logs',
        icon: FileText,
        badge: 'APPEND-ONLY',
        badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getDaemonStatus();
        setDaemonStatus(res);
      } catch {
        // Handled gracefully
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-72 border-r border-[#3F4850]/40 bg-[#0A0E17] p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-6">
        {/* Navigation Sections */}
        {navSections.map((section, idx) => (
          <div key={section.title} className="space-y-2">
            <div className="px-2">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#89929B] uppercase font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-[#4EDEA3] animate-pulse' : 'bg-[#93CCFF]'}`}></span>
                {section.title}
              </div>
            </div>

            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 relative ${
                      isActive
                        ? 'bg-[#181B25] text-white border border-[#93CCFF]/50 shadow-md shadow-[#93CCFF]/10'
                        : 'text-[#BFC7D2] hover:text-white hover:bg-[#131722] border border-transparent hover:border-[#3F4850]/40'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#93CCFF] rounded-r shadow-[0_0_8px_#93CCFF]"></span>
                    )}

                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#93CCFF]' : 'text-[#89929B] group-hover:text-white'}`} />
                      <span className="font-mono text-[12px]">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold tracking-wider border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Enhanced SOC Daemon Bridge Telemetry Box */}
      <div className="relative mt-5 rounded-xl bg-gradient-to-b from-[#111625] via-[#0D121F] to-[#080B12] border border-[#3F4850]/60 p-3.5 shadow-2xl overflow-hidden group hover:border-[#93CCFF]/40 transition-all duration-300">
        {/* Top Cyber Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4EDEA3]/70 to-transparent"></div>

        {/* Header Row */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#3F4850]/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#4EDEA3]/10 border border-[#4EDEA3]/25 text-[#4EDEA3]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="text-[11px] font-extrabold tracking-wider text-white font-mono uppercase">
              DAEMON SOC BRIDGE
            </span>
          </div>

          {/* Active Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              daemonStatus?.running
                ? 'bg-emerald-500/10 border-[#4EDEA3]/30 text-[#4EDEA3]'
                : 'bg-red-500/10 border-red-500/30 text-[#FF5449]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {daemonStatus?.running && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4EDEA3] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  daemonStatus?.running ? 'bg-[#4EDEA3]' : 'bg-[#FF5449]'
                }`}
              ></span>
            </span>
            <span>{daemonStatus?.running ? 'ACTIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Telemetry Metric Rows */}
        <div className="py-2.5 space-y-2 text-[11px] font-mono">
          {/* Row 1: Interface */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#89929B] tracking-wide uppercase">
              INTERFACE
            </span>
            <span className="text-[10.5px] font-bold text-[#93CCFF] bg-[#93CCFF]/10 px-2 py-0.5 rounded border border-[#93CCFF]/25 tracking-tight shadow-sm">
              127.0.0.1:8765
            </span>
          </div>

          {/* Row 2: Active Session */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#89929B] tracking-wide uppercase">
              SESSION
            </span>
            <span className="text-[10.5px] font-semibold text-[#DFE2F0] truncate max-w-[120px]">
              {daemonStatus?.active_session_id ? daemonStatus.active_session_id.slice(0, 8) + '...' : 'IDLE (READY)'}
            </span>
          </div>

          {/* Row 3: Database */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#89929B] tracking-wide uppercase">
              DATABASE
            </span>
            <span className="text-[10.5px] font-semibold text-[#DFE2F0] flex items-center gap-1">
              SQLite <span className="text-[9.5px] text-[#89929B]">(11 Tables)</span>
            </span>
          </div>

          {/* Row 4: Honeypot / Canary */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#89929B] tracking-wide uppercase">
              CANARY SHIELD
            </span>
            <span className="text-[10.5px] font-bold text-[#4EDEA3] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#4EDEA3]" /> ACTIVE
            </span>
          </div>
        </div>

        {/* Footer: Circuit Breaker */}
        <div className="pt-2.5 border-t border-[#3F4850]/40 flex items-center justify-between font-mono">
          <span className="text-[10px] font-semibold text-[#89929B] uppercase tracking-wide">
            CIRCUIT BREAKER
          </span>
          <span
            className={`text-[9.5px] font-bold px-2 py-0.5 rounded border tracking-wide ${
              daemonStatus?.circuit_breaker_state === 'OPEN'
                ? 'bg-red-500/10 border-red-500/30 text-[#FF5449]'
                : 'bg-emerald-500/10 border-[#4EDEA3]/30 text-[#4EDEA3]'
            }`}
          >
            {daemonStatus?.circuit_breaker_state || 'CLOSED'} [NORMAL]
          </span>
        </div>
      </div>
    </aside>
  );
}
