'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
  minDuration?: number;
}

export default function LoadingScreen({ message = 'Synchronizing workstation telemetry...' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full py-20 flex flex-col items-center justify-center space-y-5 animate-in fade-in duration-200 select-none"
    >
      <div className="relative">
        <div className="absolute -inset-2 rounded-full bg-brand/15 blur-lg animate-pulse" />
        <div className="relative size-16 rounded-card bg-surface border border-line shadow-card flex items-center justify-center p-2.5">
          <Image
            src="/logo.png"
            alt="SentinelAI Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-1.5 text-center">
        <span className="text-xs font-mono font-medium text-ink-2">{message}</span>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand animate-ping" />
          <span className="text-[11px] font-mono text-ink-3">Port 8765 · SQLite Local</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Structural Skeleton for Metric Cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-card bg-surface border border-line shadow-card space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-well rounded-pill" />
        <div className="size-6 bg-well rounded-pill" />
      </div>
      <div className="h-10 w-20 bg-well rounded" />
      <div className="h-3 w-32 bg-well rounded-pill" />
    </div>
  );
}

/**
 * Structural Skeleton for Table Rows
 */
export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4 bg-surface rounded-card border border-line animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-line/60 last:border-0">
          <div className="h-3.5 w-36 bg-well rounded-pill" />
          <div className="h-3.5 w-24 bg-well rounded-pill" />
          <div className="h-3.5 w-48 bg-well rounded-pill" />
          <div className="h-5 w-16 bg-well rounded-pill" />
        </div>
      ))}
    </div>
  );
}
