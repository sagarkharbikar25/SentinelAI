'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Wrench, ShieldAlert, FileText, Activity, ShieldCheck, Terminal } from 'lucide-react';

const navItems = [
  { name: 'SOC Dashboard', href: '/', icon: LayoutDashboard, badge: 'LIVE', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Agent Interceptor', href: '/agents', icon: Bot, badge: '3 ACTIVE', badgeColor: 'bg-blue-500/10 text-[#93CCFF] border-[#93CCFF]/30' },
  { name: 'Security Threat Center', href: '/security', icon: Activity, badge: 'REALTIME', badgeColor: 'bg-amber-500/10 text-[#FFB95F] border-[#FFB95F]/30' },
  { name: 'Governance Policies', href: '/policies', icon: ShieldAlert, badge: null, badgeColor: '' },
  { name: 'Tools Registry', href: '/tools', icon: Wrench, badge: null, badgeColor: '' },
  { name: 'Audit Flight Recorder', href: '/audit-logs', icon: FileText, badge: 'LOGS', badgeColor: 'bg-slate-800 text-slate-400 border-slate-700' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-[#3F4850]/40 bg-[#0A0E17] p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-4">
        {/* Brand Department Subheader */}
        <div className="px-2 pt-1">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3] animate-pulse"></span>
            SOC ARCHITECTURE & TELEMETRY
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1C1F29] text-white border border-[#93CCFF]/40 shadow-lg shadow-[#93CCFF]/5'
                    : 'text-[#BFC7D2] hover:text-white hover:bg-[#181B25] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#93CCFF]' : 'text-[#89929B]'}`} />
                  <span className="font-mono">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold tracking-wider border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Telemetry & Daemon Status Box */}
      <div className="p-3.5 rounded-xl bg-[#181B25] border border-[#3F4850]/50 text-xs text-[#BFC7D2] space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-white">
            <Terminal className="w-3.5 h-3.5 text-[#93CCFF]" />
            <span>DAEMON TELEMETRY</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-pulse"></span>
        </div>
        <div className="space-y-1 font-mono text-[10px] text-[#89929B] border-t border-[#3F4850]/40 pt-2">
          <div className="flex justify-between">
            <span>ENDPOINT:</span>
            <span className="text-[#93CCFF]">127.0.0.1:8765</span>
          </div>
          <div className="flex justify-between">
            <span>POLICY ENGINE:</span>
            <span className="text-[#4EDEA3]">ACTIVE (ALLOW/BLOCK)</span>
          </div>
          <div className="flex justify-between">
            <span>CANARY SHIELD:</span>
            <span className="text-[#4EDEA3]">ENABLED</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
