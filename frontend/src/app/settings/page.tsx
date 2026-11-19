'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  FolderLock,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const [mode, setMode] = useState<'ASK' | 'OBSERVE' | 'STRICT'>('ASK');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2EAE4] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-[#059669]">
              Configuration &bull; Local security daemon
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#111915] tracking-tight text-balance">
            Workstation Settings
          </h1>
          <p className="text-xs text-[#536459] text-pretty">
            Runtime operational mode, timeout countdowns, and path protection tiers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium transition-colors shadow-xs"
        >
          Save settings
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>Settings successfully applied to SentinelAI daemon.</span>
        </div>
      )}

      {/* Operational Mode */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-[#111915] flex items-center gap-2">
            <Shield className="size-4 text-[#059669]" />
            <span>Operational Security Mode</span>
          </h2>
          <p className="text-xs text-[#536459] mt-0.5">
            Defines daemon behavior when agents trigger high-risk or untracked file operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => setMode('ASK')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'ASK'
                ? 'bg-[#EAF5EE] border-[#BBF7D0] shadow-xs'
                : 'bg-[#F9FAF9] border-[#E2EAE4] hover:bg-[#F2F6F3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-[#111915]">Ask (Interactive)</span>
              {mode === 'ASK' && <span className="size-2 rounded-full bg-emerald-600" />}
            </div>
            <p className="text-[11px] text-[#536459] leading-relaxed">
              Pauses agent execution and prompts the user with live 30s countdown modal. Default fail-closed on timeout.
            </p>
          </div>

          <div
            onClick={() => setMode('OBSERVE')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'OBSERVE'
                ? 'bg-[#EAF5EE] border-[#BBF7D0] shadow-xs'
                : 'bg-[#F9FAF9] border-[#E2EAE4] hover:bg-[#F2F6F3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-[#111915]">Observe (Auditing)</span>
              {mode === 'OBSERVE' && <span className="size-2 rounded-full bg-emerald-600" />}
            </div>
            <p className="text-[11px] text-[#536459] leading-relaxed">
              Logs all operations to immutable SQLite flight recorder without blocking execution. Ideal for testing.
            </p>
          </div>

          <div
            onClick={() => setMode('STRICT')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'STRICT'
                ? 'bg-[#EAF5EE] border-[#BBF7D0] shadow-xs'
                : 'bg-[#F9FAF9] border-[#E2EAE4] hover:bg-[#F2F6F3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-[#111915]">Strict (Zero-Trust)</span>
              {mode === 'STRICT' && <span className="size-2 rounded-full bg-emerald-600" />}
            </div>
            <p className="text-[11px] text-[#536459] leading-relaxed">
              Automatically blocks all unmanifested actions and untracked file deletions without prompt dialogs.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Timeout Slider */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-[#111915] flex items-center gap-2">
            <Clock className="size-4 text-[#059669]" />
            <span>Interactive Prompt Timeout</span>
          </h2>
          <p className="text-xs text-[#536459] mt-0.5">
            Duration before an unanswered permission prompt automatically defaults to fail-closed block.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#536459]">Auto-deny window:</span>
            <span className="font-bold text-[#111915] tabular-nums">{timeoutSeconds} seconds</span>
          </div>

          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            className="w-full h-2 bg-[#E2EAE4] rounded-lg appearance-none cursor-pointer accent-[#059669]"
          />

          <div className="flex justify-between text-[10px] font-mono text-[#75887B]">
            <span>10s (Fast response)</span>
            <span>30s (Default)</span>
            <span>60s (Extended review)</span>
          </div>
        </div>
      </div>

      {/* Critical Path Protection Map */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-[#111915] flex items-center gap-2">
            <FolderLock className="size-4 text-[#059669]" />
            <span>Critical Path Protection Map</span>
          </h2>
          <p className="text-xs text-[#536459] mt-0.5">
            Glob scopes deterministically blocked by policy gate from agent deletion or corruption.
          </p>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {[
            { scope: '~/.ssh/**', label: 'SSH User Keys & Host Auth', tier: 'HARD_BLOCK' },
            { scope: '~/.aws/**', label: 'Cloud Provider Credentials', tier: 'HARD_BLOCK' },
            { scope: '**/.git/**', label: 'Repository Internal VCS Tree', tier: 'HARD_BLOCK' },
            { scope: '**/.env*', label: 'Environment & API Secrets', tier: 'HARD_BLOCK' },
            { scope: '**/node_modules/**', label: 'Dependency Trees', tier: 'MONITORED' },
          ].map((item) => (
            <div
              key={item.scope}
              className="p-3 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-[#111915]">{item.scope}</span>
                <span className="text-[11px] text-[#75887B] ml-2">({item.label})</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.tier === 'HARD_BLOCK'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {item.tier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
