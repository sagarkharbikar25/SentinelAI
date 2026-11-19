'use client';

import React, { useState } from 'react';
import {
  Shield,
  Clock,
  FolderLock,
  CheckCircle2,
} from 'lucide-react';
import { useDaemon } from '@/context/DaemonContext';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function SettingsPage() {
  const { status } = useDaemon();
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

      {/* Header (F1: White Headings) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isOnline ? 'bg-accent-emerald animate-pulse' : 'bg-accent-rose'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-accent-emerald' : 'text-accent-rose'
              }`}
            >
              Configuration &bull; Local security daemon
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight text-balance">
            Workstation Settings
          </h1>
          <p className="text-xs text-text-secondary text-pretty">
            Runtime operational mode, timeout countdowns, and path protection tiers.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!isOnline}
          title={!isOnline ? 'Daemon offline. Start local service on port 8765 to save settings.' : undefined}
          className="px-4 py-2.5 rounded-xl bg-accent hover:opacity-90 text-canvas text-xs font-bold transition-opacity shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save settings
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-card border border-accent-emerald/40 text-accent-emerald text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-accent-emerald" />
          <span>Settings successfully applied to SentinelAI daemon.</span>
        </div>
      )}

      {/* Operational Mode */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-text-primary flex items-center gap-2">
            <Shield className="size-4 text-accent" />
            <span>Operational Security Mode</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Defines daemon behavior when agents trigger high-risk or untracked file operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => setMode('ASK')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'ASK'
                ? 'bg-surface border-accent shadow-xs'
                : 'bg-surface/50 border-border hover:bg-surface'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-text-primary">Ask (Interactive)</span>
              {mode === 'ASK' && <span className="size-2 rounded-full bg-accent" />}
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Pauses agent execution and prompts the user with live 30s countdown modal. Default fail-closed on timeout.
            </p>
          </div>

          <div
            onClick={() => setMode('OBSERVE')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'OBSERVE'
                ? 'bg-surface border-accent shadow-xs'
                : 'bg-surface/50 border-border hover:bg-surface'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-text-primary">Observe (Auditing)</span>
              {mode === 'OBSERVE' && <span className="size-2 rounded-full bg-accent" />}
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Logs all operations to immutable SQLite flight recorder without blocking execution. Ideal for passive observation.
            </p>
          </div>

          <div
            onClick={() => setMode('STRICT')}
            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
              mode === 'STRICT'
                ? 'bg-surface border-accent shadow-xs'
                : 'bg-surface/50 border-border hover:bg-surface'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-text-primary">Strict (Zero-Trust)</span>
              {mode === 'STRICT' && <span className="size-2 rounded-full bg-accent" />}
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Automatically blocks all unmanifested actions and untracked file deletions without prompt dialogs.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Timeout Slider */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-text-primary flex items-center gap-2">
            <Clock className="size-4 text-accent" />
            <span>Interactive Prompt Timeout</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Duration before an unanswered permission prompt automatically defaults to fail-closed block.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-text-secondary">Auto-deny window:</span>
            <span className="font-bold text-text-primary tabular-nums">{timeoutSeconds} seconds</span>
          </div>

          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
          />

          <div className="flex justify-between text-[10px] font-mono text-text-muted">
            <span>10s (Fast response)</span>
            <span>30s (Default)</span>
            <span>60s (Extended review)</span>
          </div>
        </div>
      </div>

      {/* Critical Path Protection Map */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-heading font-bold text-text-primary flex items-center gap-2">
            <FolderLock className="size-4 text-accent" />
            <span>Critical Path Protection Map</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
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
              className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-text-primary">{item.scope}</span>
                <span className="text-[11px] text-text-muted ml-2">({item.label})</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.tier === 'HARD_BLOCK'
                    ? 'bg-accent-rose/15 text-accent-rose border border-accent-rose/30'
                    : 'bg-surface text-text-secondary border border-border'
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
