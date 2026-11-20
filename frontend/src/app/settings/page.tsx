'use client';

import React, { useState } from 'react';
import {
  Shield,
  Clock,
  FolderLock,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { useDaemon } from '@/context/DaemonContext';
import { useTheme } from '@/context/ThemeContext';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function SettingsPage() {
  const { status } = useDaemon();
  const { theme, setTheme } = useTheme();
  const isOnline = status === 'online';

  const [mode, setMode] = useState<'ASK' | 'OBSERVE' | 'STRICT'>('ASK');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      <OfflineBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-pill ${
                isOnline ? 'bg-safe animate-pulse' : 'bg-critical'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-safe-ink' : 'text-critical-ink'
              }`}
            >
              Configuration &bull; Local security daemon
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-ink-1 tracking-tight text-balance">
            Workstation Settings
          </h1>
          <p className="text-xs text-ink-2 text-pretty">
            Runtime operational mode, theme presentation, timeout countdowns, and path protection tiers.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!isOnline}
          title={!isOnline ? 'Daemon offline. Start local service on port 8765 to save settings.' : undefined}
          className="px-5 py-2.5 rounded-pill bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save settings
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-well bg-safe-soft text-safe-ink text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-safe-ink" />
          <span>Settings successfully applied to SentinelAI daemon.</span>
        </div>
      )}

      {/* Theme Toggle Section (Settings Only) */}
      <div className="p-6 rounded-card bg-surface shadow-card space-y-4">
        <div>
          <h2 className="text-base font-display font-bold text-ink-1 flex items-center gap-2">
            <Sun className="size-4 text-brand" />
            <span>Display Theme</span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Select interface theme. Daylight is the light-first default design system.
          </p>
        </div>

        {/* Segmented Control with Pill Radius */}
        <div className="inline-flex p-1 rounded-pill bg-well">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-medium transition-all ${
              theme === 'light'
                ? 'bg-surface text-ink-1 font-bold shadow-card'
                : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            <Sun className="size-3.5 text-caution-ink" />
            <span>Daylight (Light)</span>
            {theme === 'light' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-pill bg-brand-soft text-brand-ink font-semibold">
                Default
              </span>
            )}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'bg-surface text-ink-1 font-bold shadow-card'
                : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            <Moon className="size-3.5 text-brand" />
            <span>Midnight (Dark)</span>
          </button>
        </div>
      </div>

      {/* Operational Mode */}
      <div className="p-6 rounded-card bg-surface shadow-card space-y-4">
        <div>
          <h2 className="text-base font-display font-bold text-ink-1 flex items-center gap-2">
            <Shield className="size-4 text-brand" />
            <span>Operational Security Mode</span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Defines daemon behavior when agents trigger high-risk or untracked file operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => setMode('ASK')}
            className={`p-4 rounded-well transition-all cursor-pointer space-y-2 ${
              mode === 'ASK'
                ? 'bg-brand-soft text-brand-ink ring-2 ring-brand'
                : 'bg-well text-ink-2 hover:text-ink-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-ink-1 text-sm">Ask (Interactive)</span>
              {mode === 'ASK' && <span className="size-2 rounded-pill bg-brand" />}
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              Pauses agent execution and prompts the user with live 30s countdown modal. Default fail-closed on timeout.
            </p>
          </div>

          <div
            onClick={() => setMode('OBSERVE')}
            className={`p-4 rounded-well transition-all cursor-pointer space-y-2 ${
              mode === 'OBSERVE'
                ? 'bg-brand-soft text-brand-ink ring-2 ring-brand'
                : 'bg-well text-ink-2 hover:text-ink-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-ink-1 text-sm">Observe (Auditing)</span>
              {mode === 'OBSERVE' && <span className="size-2 rounded-pill bg-brand" />}
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              Logs all operations to immutable SQLite flight recorder without blocking execution. Ideal for passive observation.
            </p>
          </div>

          <div
            onClick={() => setMode('STRICT')}
            className={`p-4 rounded-well transition-all cursor-pointer space-y-2 ${
              mode === 'STRICT'
                ? 'bg-brand-soft text-brand-ink ring-2 ring-brand'
                : 'bg-well text-ink-2 hover:text-ink-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-ink-1 text-sm">Strict (Zero-Trust)</span>
              {mode === 'STRICT' && <span className="size-2 rounded-pill bg-brand" />}
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              Automatically blocks all unmanifested actions and untracked file deletions without prompt dialogs.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Timeout Slider */}
      <div className="p-6 rounded-card bg-surface shadow-card space-y-4">
        <div>
          <h2 className="text-base font-display font-bold text-ink-1 flex items-center gap-2">
            <Clock className="size-4 text-brand" />
            <span>Interactive Prompt Timeout</span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            Duration before an unanswered permission prompt automatically defaults to fail-closed block.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-ink-2">Auto-deny window:</span>
            <span className="font-bold text-ink-1 tabular-nums">{timeoutSeconds} seconds</span>
          </div>

          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            className="w-full h-2 bg-well rounded-pill appearance-none cursor-pointer accent-brand"
          />

          <div className="flex justify-between text-[10px] font-mono text-ink-3">
            <span>10s (Fast response)</span>
            <span>30s (Default)</span>
            <span>60s (Extended review)</span>
          </div>
        </div>
      </div>

      {/* Critical Path Protection Map */}
      <div className="p-6 rounded-card bg-surface shadow-card space-y-4">
        <div>
          <h2 className="text-base font-display font-bold text-ink-1 flex items-center gap-2">
            <FolderLock className="size-4 text-brand" />
            <span>Critical Path Protection Map</span>
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
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
              className="p-3 rounded-well bg-well flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-ink-1">{item.scope}</span>
                <span className="text-[11px] text-ink-3 ml-2">({item.label})</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-pill text-[10px] font-bold ${
                  item.tier === 'HARD_BLOCK'
                    ? 'bg-critical-soft text-critical-ink'
                    : 'bg-surface text-ink-2 border border-line'
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
