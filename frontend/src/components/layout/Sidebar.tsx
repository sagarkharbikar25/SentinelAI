'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeSvg,
  VaultSvg,
  AuditSvg,
  LabSvg,
  SettingsSvg,
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
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Backup vault',
    href: '/vault',
    icon: VaultSvg,
    badge: 'Vault',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    name: 'Log & audit',
    href: '/audit-logs',
    icon: AuditSvg,
    badge: 'Chained',
    badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  },
  {
    name: 'Test lab',
    href: '/lab',
    icon: LabSvg,
    badge: 'Chaos VM',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
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
    <aside className="w-64 border-r border-[#E2EAE4] bg-[#FFFFFF] flex flex-col justify-between shrink-0 select-none relative z-30">
      {/* Top Header / App Title */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-[#E2EAE4] gap-3 bg-[#FFFFFF]">
          <div className="relative size-9 rounded-xl bg-[#F4F7F5] border border-[#D1DDD5] flex items-center justify-center p-1 overflow-hidden shadow-xs">
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
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-sm tracking-tight text-[#111915]">
                Sentinel<span className="text-[#059669]">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-medium">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-[#536459] truncate">
              Local security daemon
            </p>
          </div>
        </div>

        {/* Workstation Navigation */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#75887B]">
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
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EAF5EE] text-[#166534] font-semibold border border-[#BBF7D0] shadow-xs'
                      : 'text-[#536459] hover:bg-[#F2F6F3] hover:text-[#111915] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`size-5 flex items-center justify-center transition-colors ${
                      isActive ? 'text-[#059669]' : 'text-[#75887B] group-hover:text-[#111915]'
                    }`}>
                      <Icon className="size-4" />
                    </span>
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border tabular-nums ${item.badgeColor}`}
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
      <div className="p-3 border-t border-[#E2EAE4] space-y-2 bg-[#F9FAF9]">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 ${
            pathname === '/settings'
              ? 'bg-[#EAF5EE] text-[#166534] font-semibold border border-[#BBF7D0] shadow-xs'
              : 'text-[#536459] hover:bg-[#F2F6F3] hover:text-[#111915] border border-transparent'
          }`}
        >
          <SettingsSvg className="size-4 text-[#75887B]" />
          <span>Settings</span>
        </Link>

        {/* Live Daemon Status Card */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-[#536459] flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${daemonStatus?.running ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
              Port 8765
            </span>
            <span className={`font-bold ${daemonStatus?.running ? 'text-emerald-700' : 'text-zinc-500'}`}>
              {daemonStatus?.running ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#75887B] font-mono tabular-nums pt-1 border-t border-[#E2EAE4]">
            <span>Active session</span>
            <span className="text-[#111915] font-medium truncate max-w-[100px]">
              {daemonStatus?.active_session_id ? daemonStatus.active_session_id.slice(0, 8) : 'None'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
