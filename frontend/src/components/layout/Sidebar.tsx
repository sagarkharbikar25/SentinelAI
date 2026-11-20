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
    <aside className="w-64 border-r border-line bg-surface flex flex-col shrink-0 select-none h-dvh sticky top-0 z-30">
      {/* Top Header / App Title */}
      <div className="h-16 flex items-center px-5 border-b border-line gap-3 bg-surface shrink-0">
        <div className="relative size-9 rounded-well bg-well flex items-center justify-center p-1 overflow-hidden">
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
            <span className="font-display font-extrabold text-base tracking-tight text-ink-1">
              Sentinel<span className="text-brand">AI</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-well text-ink-2 font-medium">
              v0.1
            </span>
          </div>
          <p className="text-[11px] text-ink-3 truncate">
            Local security daemon
          </p>
        </div>
      </div>

      {/* Navigation (Pill radius, no eyebrow lines) */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <nav className="space-y-1 pt-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-pill text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-soft text-brand-ink font-semibold'
                    : 'text-ink-2 hover:bg-well hover:text-ink-1'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-5 flex items-center justify-center transition-colors ${
                      isActive ? 'text-brand-ink' : 'text-ink-3 group-hover:text-ink-1'
                    }`}
                  >
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
      <div className="p-3 border-t border-line space-y-2 bg-surface mt-auto shrink-0">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-pill text-xs font-medium transition-colors duration-150 ${
            pathname === '/settings'
              ? 'bg-brand-soft text-brand-ink font-semibold'
              : 'text-ink-2 hover:bg-well hover:text-ink-1'
          }`}
        >
          <SettingsSvg className="size-4 text-ink-3" />
          <span>Settings</span>
        </Link>

        {/* Live Daemon Status Card (Well radius 14px, no border) */}
        <div className="p-3 rounded-well bg-well space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-ink-3 flex items-center gap-1.5">
              <span
                className={`size-2 rounded-pill ${
                  isOnline
                    ? 'bg-safe animate-pulse'
                    : isConnecting
                    ? 'bg-caution animate-ping'
                    : 'bg-critical'
                }`}
              />
              Port 8765
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-pill text-[10px] ${
                isOnline
                  ? 'bg-safe-soft text-safe-ink'
                  : isConnecting
                  ? 'bg-caution-soft text-caution-ink'
                  : 'bg-critical-soft text-critical-ink'
              }`}
            >
              {isOnline ? 'Connected' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-ink-3 font-mono tabular-nums pt-1 border-t border-line">
            <span>Active session</span>
            <span
              className="text-ink-1 font-medium truncate max-w-[100px]"
              title={activeSessionId || 'None'}
            >
              {activeSessionId ? activeSessionId.slice(0, 8) : 'None'}
            </span>
          </div>

          {!isOnline && lastSeenAt && (
            <div className="text-[9px] text-ink-3 font-mono truncate pt-0.5">
              Last seen: {lastSeenAt.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
