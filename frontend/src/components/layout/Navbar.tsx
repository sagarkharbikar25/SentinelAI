'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Bell, Lock, Terminal, Activity, Clock } from 'lucide-react';

export default function Navbar() {
  const [time, setTime] = useState<string>('00:00:00 IST');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-[#3F4850]/40 bg-[#0A0E17]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xl select-none">
      {/* Brand & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Authentic SOC Emblem Icon */}
        <div className="w-10 h-10 rounded-lg bg-[#181B25] border border-[#93CCFF]/40 flex items-center justify-center text-[#93CCFF] shadow-md shadow-[#93CCFF]/10">
          <Shield className="w-5 h-5 text-[#93CCFF]" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#89929B]">
            <Terminal className="w-3.5 h-3.5 text-[#93CCFF]" />
            <span className="text-white font-bold tracking-wider">SENTINAL AI</span>
            <span>/</span>
            <span className="text-[#93CCFF] font-semibold tracking-wide">SOC COMMAND & GOVERNANCE</span>
          </div>
          <p className="text-[11px] text-[#BFC7D2] font-medium mt-0.5">National Threat Detection & Autonomous Agent Runtime Interceptor</p>
        </div>
      </div>

      {/* Right Controls: Telemetry Clock, Daemon Status, Profile */}
      <div className="flex items-center gap-3.5 font-mono text-xs">
        {/* Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181B25] border border-[#3F4850]/40 text-[#DFE2F0]">
          <Clock className="w-3.5 h-3.5 text-[#93CCFF]" />
          <span className="text-[11px] font-semibold">{time}</span>
        </div>

        {/* Daemon Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181B25] border border-[#4EDEA3]/30 text-[#4EDEA3] text-[11px] font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-pulse shadow-sm shadow-[#4EDEA3]"></span>
          DAEMON: ONLINE (:8765)
        </div>

        {/* Notification Bell */}
        <button className="p-2 text-[#89929B] hover:text-white rounded-lg hover:bg-[#181B25] border border-transparent hover:border-[#3F4850]/40 transition">
          <Bell className="w-4 h-4" />
        </button>

        {/* Analyst Identity */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#3F4850]/40">
          <div className="w-8 h-8 rounded-lg bg-[#1C1F29] border border-[#93CCFF]/50 text-[#93CCFF] flex items-center justify-center font-bold text-xs shadow-md">
            SA
          </div>
          <div className="text-left hidden md:block leading-tight">
            <p className="text-xs font-bold text-white">Chief Security Officer</p>
            <p className="text-[10px] text-[#93CCFF] font-medium flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-[#93CCFF]" /> SUPER_ADMIN
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
