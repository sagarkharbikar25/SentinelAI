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
      className="p-4 rounded-card bg-critical-soft border border-critical/25 shadow-card text-xs font-mono space-y-3 animate-in fade-in duration-150"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-pill bg-critical/15 text-critical-ink shrink-0 mt-0.5">
            <ShieldAlertSvg className="size-4" />
          </span>
          <div>
            <p className="font-bold text-critical-ink text-sm">
              Security daemon is unreachable on http://127.0.0.1:8765
            </p>
            <p className="text-ink-2 mt-0.5 text-pretty">
              Local permission interception, prompt resolution, and live threat scanning are suspended.
              {lastSeenAt && ` Showing cached data (Last synced: ${lastSeenAt.toLocaleTimeString()}).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => refresh()}
            className="px-3.5 py-1.5 rounded-pill bg-surface hover:bg-well border border-line text-ink-1 transition-colors flex items-center gap-1.5 font-medium shadow-xs"
          >
            <ActivitySvg className="size-3 text-brand" />
            <span>Retry</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-pill bg-brand hover:bg-brand-hover text-white transition-colors font-medium flex items-center gap-1.5 shadow-xs"
            title="Copy command to clipboard"
          >
            <span>{copied ? 'Copied!' : 'Copy start command'}</span>
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-well bg-surface border border-line flex items-center justify-between text-[11px] text-ink-2">
        <span>To start daemon: <code className="text-ink-1 px-2 py-0.5 rounded-pill bg-well font-mono">{startCommand}</code></span>
        <span className="px-2 py-0.5 rounded-pill bg-critical-soft text-critical-ink font-bold text-[10px]">Port 8765 required</span>
      </div>
    </div>
  );
}
