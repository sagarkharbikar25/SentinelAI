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
import { useNavigationLoader } from '@/context/NavigationContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeSvg,
    badge: 'Live',
  },
  {
    name: 'Backup vault',
    href: '/vault',
    icon: VaultSvg,
    badge: 'Vault',
  },
  {
    name: 'Log & audit',
    href: '/audit-logs',
    icon: AuditSvg,
    badge: 'Chained',
  },
  {
    name: 'Test lab',
    href: '/lab',
    icon: LabSvg,
    badge: 'Chaos VM',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, activeSessionId, lastSeenAt, latencyMs } = useDaemon();
  const { startNavigation } = useNavigationLoader();

  const isOnline = status === 'online';
  const isConnecting = status === 'connecting';

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      startNavigation(href);
    }
  };

  return (
    <aside className="w-64 border-r border-line bg-surface flex flex-col shrink-0 select-none h-dvh sticky top-0 z-30 shadow-xs">
      {/* Top Header / Brand Logo & Title */}
      <div className="h-16 flex items-center px-4 border-b border-line gap-3 bg-surface shrink-0">
        <div className="relative size-10 rounded-well bg-well/90 border border-line flex items-center justify-center p-1 overflow-hidden shadow-xs shrink-0 ring-1 ring-brand/10">
          <Image
            src="/logo.png"
            alt="SentinelAI Logo"
            width={34}
            height={34}
            className="object-contain rounded-md"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-base tracking-tight text-ink-1">
              Sentinel<span className="text-brand">AI</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-well text-ink-2 font-medium">
              v0.1
            </span>
          </div>
          <p className="text-[11px] text-ink-3 truncate">
            Sovereign security daemon
          </p>
        </div>
      </div>

      {/* Navigation (Pill radius, clean section grouping) */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        <div>
          <div className="px-3.5 pb-1.5 pt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-3/70">
            Workstation
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-pill text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-soft text-brand-ink font-semibold shadow-xs'
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

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-pill font-medium transition-colors ${
                        isActive
                          ? 'bg-brand/15 text-brand-ink'
                          : 'bg-well text-ink-3 group-hover:text-ink-2'
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

      {/* Pinned Footer (Settings + Port status card) */}
      <div className="p-3 border-t border-line space-y-2 bg-surface mt-auto shrink-0">
        <Link
          href="/settings"
          onClick={() => handleNavClick('/settings')}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-pill text-xs font-medium transition-colors duration-150 ${
            pathname === '/settings'
              ? 'bg-brand-soft text-brand-ink font-semibold shadow-xs'
              : 'text-ink-2 hover:bg-well hover:text-ink-1'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <SettingsSvg className="size-4 text-ink-3" />
            <span>Settings</span>
          </div>
          <span className="text-[10px] font-mono text-ink-3">Preferences</span>
        </Link>

        {/* Live Daemon Status Card (Well radius 14px, no border) */}
        <div className="p-3 rounded-well bg-well space-y-2 text-xs border border-line/40">
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
              {isOnline
                ? latencyMs !== null
                  ? `Active (${latencyMs}ms)`
                  : 'Active'
                : isConnecting
                ? 'Connecting'
                : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-ink-3 font-mono tabular-nums pt-1 border-t border-line/60">
            <span>Session</span>
            <span
              className="text-ink-1 font-medium truncate max-w-[100px]"
              title={activeSessionId || 'None'}
            >
              {activeSessionId ? activeSessionId.slice(0, 8) : 'Standby'}
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
