'use client';

import React, { useState } from 'react';
import { useDaemon } from '@/context/DaemonContext';
import { ShieldAlertSvg, ActivitySvg } from '@/components/icons/SvgIcons';

export default function OfflineBanner() {
  const { status, refresh, lastSeenAt } = useDaemon();
  const [copied, setCopied] = useState(false);

  if (status !== 'offline') return null;

  const startCommand = 'python -m sentinel.main';

  const handleCopy = () => {
    navigator.clipboard.writeText(startCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="alert"
      className="p-4 rounded-2xl bg-card border border-accent-amber/40 shadow-lg text-xs font-mono space-y-3 animate-in fade-in duration-150"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-accent-amber/15 text-accent-amber shrink-0 mt-0.5">
            <ShieldAlertSvg className="size-4" />
          </span>
          <div>
            <p className="font-bold text-text-primary">
              Security daemon is unreachable on http://127.0.0.1:8765
            </p>
            <p className="text-text-muted mt-0.5 text-pretty">
              Local permission interception, prompt resolution, and live threat scanning are suspended.
              {lastSeenAt && ` Showing cached data (Last synced: ${lastSeenAt.toLocaleTimeString()}).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => refresh()}
            className="px-3 py-1.5 rounded-xl bg-surface hover:bg-card-hover border border-border text-text-primary transition-colors flex items-center gap-1.5 font-medium"
          >
            <ActivitySvg className="size-3 text-accent" />
            <span>Retry</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent transition-colors font-medium flex items-center gap-1.5"
            title="Copy command to clipboard"
          >
            <span>{copied ? 'Copied!' : 'Copy start command'}</span>
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between text-[11px] text-text-muted">
        <span>To start daemon: <code className="text-text-primary px-1.5 py-0.5 rounded bg-card border border-border">{startCommand}</code></span>
        <span className="text-[10px] text-accent-amber">Port 8765 required</span>
      </div>
    </div>
  );
}
