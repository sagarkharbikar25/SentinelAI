import React from 'react';
import { Activity, Zap } from 'lucide-react';

export default function SecurityCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-400" /> Security Threat Center
        </h2>
        <p className="text-xs text-gray-400">
          Live prompt injection detection, risk scoring, and real-time security decision engine (Member 2 — Semester 6 Ready).
        </p>
      </div>

      <div className="p-12 rounded-xl bg-[#16181D] border border-[#262933] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Security Decision Engine Placeholder</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Semester 5 foundation is active. In Semester 6, this view will feature the live Request Tester (submit prompts → see ALLOW/WARN/BLOCK decisions + risk explanations).
        </p>
      </div>
    </div>
  );
}
