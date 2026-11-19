'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  SentinelLogoSvg,
  HomeSvg,
  VaultSvg,
  AuditSvg,
  LabSvg,
  SettingsSvg,
  ShieldCheckSvg,
  ActivitySvg,
} from '@/components/icons/SvgIcons';
import { getDaemonStatus, DaemonStatus } from '@/lib/daemon';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const mainNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeSvg,
    badge: 'Live',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    name: 'Backup vault',
    href: '/vault',
    icon: VaultSvg,
    badge: 'Vault',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    name: 'Log & audit',
    href: '/audit-logs',
    icon: AuditSvg,
    badge: 'Chained',
    badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  {
    name: 'Test lab',
    href: '/lab',
    icon: LabSvg,
    badge: 'Chaos VM',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
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
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 border-r border-[#1E2536] bg-[#0D1017] flex flex-col justify-between shrink-0 select-none relative z-30">
      {/* Top Header / App Title */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-[#1E2536] gap-3 bg-[#08090C]/80">
          <div className="relative size-9 rounded-lg bg-[#131722] border border-[#00E5FF]/30 flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
            <Image
              src="/logo.png"
              alt="SentinelAI Logo"
              width={36}
              height={36}
              className="object-cover rounded-md"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-sm tracking-wide text-white">
                SENTINEL<span className="text-[#00E5FF]">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#131722] text-[#8A94A6] border border-[#1E2536]">
                v0.1
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#8A94A6] truncate">
              Local security daemon
            </p>
          </div>
        </div>

        {/* Workstation Navigation */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A94A6]">
            Workstation
          </p>

          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#131722] text-white border border-[#00E5FF]/30 shadow-xs'
                      : 'text-[#8A94A6] hover:bg-[#131722]/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`size-5 flex items-center justify-center transition-colors ${
                      isActive ? 'text-[#00E5FF]' : 'text-[#8A94A6] group-hover:text-white'
                    }`}>
                      <Icon className="size-4" />
                    </span>
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border tabular-nums ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Settings & Daemon Live Telemetry */}
      <div className="p-3 border-t border-[#1E2536] space-y-2 bg-[#08090C]/60">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
            pathname === '/settings'
              ? 'bg-[#131722] text-white border border-[#00E5FF]/30 shadow-xs'
              : 'text-[#8A94A6] hover:bg-[#131722]/60 hover:text-white border border-transparent'
          }`}
        >
          <SettingsSvg className="size-4 text-[#8A94A6]" />
          <span>Settings</span>
        </Link>

        {/* Live Daemon Status Card */}
        <div className="p-3 rounded-lg bg-[#131722] border border-[#1E2536] space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#8A94A6] flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${daemonStatus?.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              Port 8765
            </span>
            <span className="text-white font-bold">
              {daemonStatus?.running ? 'Online' : 'Standby'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8A94A6] font-mono tabular-nums pt-1 border-t border-[#1E2536]">
            <span>Active session</span>
            <span className="text-white truncate max-w-[100px]">
              {daemonStatus?.active_session_id ? daemonStatus.active_session_id.slice(0, 8) : 'None'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
