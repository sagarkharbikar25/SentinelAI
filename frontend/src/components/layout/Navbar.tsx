'use client';

import React from 'react';
import { Shield, Bell, Lock } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-[#232733] bg-[#13151C]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
            SentinelAI <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">v1.0-Sem5</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">AI Agent Security & Governance Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
          Backend API: Online (3001)
        </div>

        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1D212B] transition">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#232733]">
          <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shadow-md">
            SA
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-white">Admin User</p>
            <p className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-purple-400" /> SUPER_ADMIN
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
