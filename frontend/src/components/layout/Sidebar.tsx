'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Wrench, ShieldAlert, FileText, Activity } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, tag: 'Member 1' },
  { name: 'AI Agents', href: '/agents', icon: Bot, tag: 'Member 1' },
  { name: 'Tools Registry', href: '/tools', icon: Wrench, tag: 'Member 2' },
  { name: 'Security Policies', href: '/policies', icon: ShieldAlert, tag: 'Member 2' },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText, tag: 'Member 2' },
  { name: 'Security Center', href: '/security', icon: Activity, tag: 'Member 2' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[#232733] bg-[#13151C]/60 backdrop-blur-md p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
          Governance & Operations
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#1D212B]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide border ${
                item.tag === 'Member 2' 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}>
                {item.tag}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-[#13151C] border border-[#232733] text-xs text-slate-300 space-y-1 shadow-md">
        <p className="font-bold text-white flex items-center justify-between">
          <span>Member 2 — Security UI</span>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
        </p>
        <p className="text-slate-400">Semester 5 Active Mode</p>
        <p className="text-[11px] text-blue-400 font-semibold pt-1">Target: Port 3001 Connected</p>
      </div>
    </aside>
  );
}
