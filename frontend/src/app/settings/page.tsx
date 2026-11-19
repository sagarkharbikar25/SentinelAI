'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  FolderLock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const [mode, setMode] = useState<'ASK' | 'OBSERVE' | 'STRICT'>('ASK');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);
  const [avatarName, setAvatarName] = useState('Aegis');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3F4850]/40 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#DFE2F0] flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#93CCFF]" />
            SENTINELAI WORKSTATION SETTINGS
          </h1>
          <p className="text-[#8A96A8] text-[11px] mt-0.5">
            Runtime operational mode, timeout countdowns, and protection tiers
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] font-bold text-xs shadow-md transition"
        >
          SAVE SETTINGS
        </button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#4EDEA3] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings successfully applied to SentinelAI daemon.</span>
        </div>
      )}

      {/* Operational Mode */}
      <div className="p-5 rounded-xl bg-[#0E121B] border border-[#3F4850]/40 space-y-4">
        <h2 className="text-sm font-bold text-[#DFE2F0] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#93CCFF]" /> OPERATIONAL SECURITY MODE
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => setMode('ASK')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              mode === 'ASK'
                ? 'bg-[#181E2B] border-[#93CCFF] text-white shadow-md'
                : 'bg-[#141824] border-[#3F4850]/40 text-[#8A96A8] hover:border-[#3F4850]'
            }`}
          >
            <div className="font-bold text-xs text-[#93CCFF]">ASK (RECOMMENDED)</div>
            <p className="text-[11px] mt-1 leading-relaxed">
              Pauses agent on HIGH/CRITICAL actions; prompts user with 30s countdown. Auto-blocks on timeout.
            </p>
          </div>

          <div
            onClick={() => setMode('OBSERVE')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              mode === 'OBSERVE'
                ? 'bg-[#181E2B] border-[#93CCFF] text-white shadow-md'
                : 'bg-[#141824] border-[#3F4850]/40 text-[#8A96A8] hover:border-[#3F4850]'
            }`}
          >
            <div className="font-bold text-xs text-[#FFB95F]">OBSERVE (PASSIVE)</div>
            <p className="text-[11px] mt-1 leading-relaxed">
              Logs all actions silently to the flight recorder; backs up deleted files without interrupting agent.
            </p>
          </div>

          <div
            onClick={() => setMode('STRICT')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              mode === 'STRICT'
                ? 'bg-[#181E2B] border-[#93CCFF] text-white shadow-md'
                : 'bg-[#141824] border-[#3F4850]/40 text-[#8A96A8] hover:border-[#3F4850]'
            }`}
          >
            <div className="font-bold text-xs text-[#FF5449]">STRICT (LOCKDOWN)</div>
            <p className="text-[11px] mt-1 leading-relaxed">
              Instantly blocks any action outside explicitly granted folders. Zero prompts, maximum defense.
            </p>
          </div>
        </div>
      </div>

      {/* Ask Timeout Countdown */}
      <div className="p-5 rounded-xl bg-[#0E121B] border border-[#3F4850]/40 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#DFE2F0] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFB95F]" /> ASK TIMEOUT DURATION
          </h2>
          <span className="font-bold text-[#93CCFF]">{timeoutSeconds} SECONDS</span>
        </div>
        <p className="text-[#8A96A8] text-[11px]">
          Countdown period before an unanswered prompt automatically defaults to DENY.
        </p>
        <input
          type="range"
          min="15"
          max="120"
          step="5"
          value={timeoutSeconds}
          onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
          className="w-full accent-[#3198DC] bg-[#141824] h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* Protection Map */}
      <div className="p-5 rounded-xl bg-[#0E121B] border border-[#3F4850]/40 space-y-3">
        <h2 className="text-sm font-bold text-[#DFE2F0] flex items-center gap-2">
          <FolderLock className="w-4 h-4 text-[#4EDEA3]" /> PROTECTION MAP (TIERS)
        </h2>
        <div className="divide-y divide-[#3F4850]/30 text-[11px]">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-[#DFE2F0]">d:/GitHub/SentinelAI</div>
              <div className="text-[#8A96A8]">Active Workspace</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[#4EDEA3] border border-emerald-500/30 font-bold">
              BACKUP ZONE (FULL VERSIONING)
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-[#DFE2F0]">C:/Windows, C:/Program Files</div>
              <div className="text-[#8A96A8]">Host Operating System</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[#FFB95F] border border-amber-500/30 font-bold">
              ALERT ONLY (HARD PROTECTED)
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-[#DFE2F0]">node_modules, .git, __pycache__, dist</div>
              <div className="text-[#8A96A8]">Caches & Ephemeral Directories</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-black/40 text-[#8A96A8] border border-white/10 font-bold">
              IGNORE (NO VAULT)
            </span>
          </div>
        </div>
      </div>

      {/* Avatar Personalization */}
      <div className="p-5 rounded-xl bg-[#0E121B] border border-[#3F4850]/40 space-y-3">
        <h2 className="text-sm font-bold text-[#DFE2F0] flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#93CCFF]" /> SYSTEM TRAY AVATAR
        </h2>
        <div className="flex items-center gap-4">
          <label className="text-[#8A96A8] shrink-0">Avatar Name:</label>
          <input
            type="text"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            className="px-3.5 py-1.5 rounded-lg bg-[#141824] border border-[#3F4850]/40 text-[#DFE2F0] focus:outline-none focus:border-[#93CCFF]/60 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
