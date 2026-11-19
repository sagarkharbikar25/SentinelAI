'use client';

import React from 'react';
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
import { useDaemon } from '@/context/DaemonContext';

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
  },
  {
    name: 'Backup vault',
    href: '/vault',
    icon: VaultSvg,
  },
  {
    name: 'Log & audit',
    href: '/audit-logs',
    icon: AuditSvg,
  },
  {
    name: 'Test lab',
    href: '/lab',
    icon: LabSvg,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, activeSessionId, lastSeenAt } = useDaemon();

  const isOnline = status === 'online';
  const isConnecting = status === 'connecting';

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col shrink-0 select-none h-dvh sticky top-0 z-30">
      {/* Top Header / App Title */}
      <div className="h-16 flex items-center px-5 border-b border-border gap-3 bg-surface shrink-0">
        <div className="relative size-9 rounded-xl bg-card border border-border flex items-center justify-center p-1 overflow-hidden shadow-xs">
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
            <span className="font-heading font-extrabold text-sm tracking-tight text-text-primary">
              Sentinel<span className="text-accent">AI</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-card text-text-muted border border-border font-medium">
              v0.1
            </span>
          </div>
          <p className="text-[11px] text-text-muted truncate">
            Local security daemon
          </p>
        </div>
      </div>

      {/* Workstation Navigation (Scrollable if needed) */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
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
                    ? 'bg-card text-accent font-semibold border border-accent/30 shadow-xs'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`size-5 flex items-center justify-center transition-colors ${
                    isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                  }`}>
                    <Icon className="size-4" />
                  </span>
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Pinned Footer (Settings + Port status card) */}
      <div className="p-3 border-t border-border space-y-2 bg-surface mt-auto shrink-0">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 ${
            pathname === '/settings'
              ? 'bg-card text-accent font-semibold border border-accent/30 shadow-xs'
              : 'text-text-secondary hover:bg-card-hover hover:text-text-primary border border-transparent'
          }`}
        >
          <SettingsSvg className="size-4 text-text-muted" />
          <span>Settings</span>
        </Link>

        {/* Live Daemon Status Card - derived strictly from useDaemon() */}
        <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-text-muted flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${
                  isOnline
                    ? 'bg-accent-emerald animate-pulse'
                    : isConnecting
                    ? 'bg-accent-amber animate-ping'
                    : 'bg-accent-rose'
                }`}
              />
              Port 8765
            </span>
            <span
              className={`font-bold ${
                isOnline
                  ? 'text-accent-emerald'
                  : isConnecting
                  ? 'text-accent-amber'
                  : 'text-accent-rose'
              }`}
            >
              {isOnline ? 'Connected' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono tabular-nums pt-1 border-t border-border">
            <span>Active session</span>
            <span className="text-text-primary font-medium truncate max-w-[100px]" title={activeSessionId || 'None'}>
              {activeSessionId ? activeSessionId.slice(0, 8) : 'None'}
            </span>
          </div>

          {!isOnline && lastSeenAt && (
            <div className="text-[9px] text-text-muted font-mono truncate pt-0.5">
              Last seen: {lastSeenAt.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
