'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Archive,
  FileText,
  FlaskConical,
  Settings,
  ShieldCheck,
  Radio,
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

const mainNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    badge: 'LIVE',
    badgeColor: 'bg-emerald-500/10 text-[#4EDEA3] border-[#4EDEA3]/30',
  },
  {
    name: 'Backup Vault',
    href: '/vault',
    icon: Archive,
    badge: 'TIME-MACHINE',
    badgeColor: 'bg-blue-500/10 text-[#93CCFF] border-[#93CCFF]/30',
  },
  {
    name: 'Log & Audit',
    href: '/audit-logs',
    icon: FileText,
    badge: 'IMMUTABLE',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  {
    name: 'Test Lab',
    href: '/lab',
    icon: FlaskConical,
    badge: 'CHAOS VM',
    badgeColor: 'bg-amber-500/10 text-[#FFB95F] border-[#FFB95F]/30',
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
    <aside className="w-64 border-r border-[#3F4850]/40 bg-[#0E121B] flex flex-col justify-between shrink-0 select-none shadow-2xl relative z-30">
      {/* Top Header / App Title */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-[#3F4850]/30 gap-3 bg-[#0A0E17]/60">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#93CCFF]/20 to-[#93CCFF]/5 border border-[#93CCFF]/40 flex items-center justify-center text-[#93CCFF] shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-[#DFE2F0] font-mono">
              SENTINEL<span className="text-[#93CCFF]">.AI</span>
            </h1>
            <p className="text-[10px] text-[#A9B4C0] font-mono tracking-tight">AGENT GUARD ENGINE</p>
          </div>
        </div>

        {/* Primary 4-Screen Navigation */}
        <div className="px-4 py-6">
          <div className="px-3 pb-2 text-[11px] font-semibold text-[#8A96A8] tracking-wider uppercase font-mono">
            WORKSTATION SCREENS
          </div>
          <nav className="space-y-1.5">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#181E2B] text-[#93CCFF] border border-[#93CCFF]/30 shadow-md shadow-[#93CCFF]/5 font-semibold'
                      : 'text-[#C5CDD9] hover:bg-[#131722] hover:text-[#DFE2F0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#93CCFF]' : 'text-[#8A96A8]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        item.badgeColor || 'border-border text-muted-foreground'
                      }`}
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

      {/* Bottom Footer: Settings & Daemon Health */}
      <div className="p-4 border-t border-[#3F4850]/30 space-y-3 bg-[#0A0E17]/40">
        {/* Settings Link */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
            pathname === '/settings'
              ? 'bg-[#181E2B] text-[#93CCFF] border border-[#93CCFF]/30'
              : 'text-[#C5CDD9] hover:bg-[#131722] hover:text-[#DFE2F0]'
          }`}
        >
          <Settings className="w-4 h-4 text-[#8A96A8]" />
          <span>Settings</span>
        </Link>

        {/* Daemon Connection Pill */}
        <div className="p-3 rounded-lg bg-[#111624] border border-[#3F4850]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                daemonStatus?.running ? 'text-emerald-400 animate-pulse' : 'text-red-400'
              }`}
            />
            <span className="text-[11px] font-mono text-[#DFE2F0]">
              {daemonStatus?.running ? 'DAEMON :8765' : 'DAEMON OFFLINE'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#4EDEA3] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {daemonStatus?.version ? `v${daemonStatus.version}` : 'v0.1.0'}
          </span>
        </div>
      </div>
    </aside>
  );
}
