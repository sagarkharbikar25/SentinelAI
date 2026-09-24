'use client';

import React from 'react';
import { Shield, Bell, Lock } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-[#232733] bg-[#13151C]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-[#1C1F29] border border-[#93CCFF]/40 flex items-center justify-center text-[#93CCFF] shadow-md">
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
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded bg-[#181B25] border border-[#4EDEA3]/30 text-[#4EDEA3] text-xs font-semibold shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4EDEA3] animate-pulse shadow-sm shadow-[#4EDEA3]"></span>
          DAEMON: ONLINE (8765)
        </div>

        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1D212B] transition">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#232733]">
          <div className="w-9 h-9 rounded-full bg-[#3198DC]/30 border border-[#93CCFF]/40 text-[#93CCFF] flex items-center justify-center font-bold text-xs shadow-md">
            SA
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-white">Admin User</p>
            <p className="text-[10px] text-[#93CCFF] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#93CCFF]" /> SUPER_ADMIN
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
