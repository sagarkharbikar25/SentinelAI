'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading workstation telemetry...' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full py-16 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200"
    >
      <div className="relative size-12 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
        <div className="size-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-mono text-text-muted text-center">{message}</p>
    </div>
  );
}

/**
 * Structural Skeleton for Metric Cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-surface rounded" />
        <div className="size-6 bg-surface rounded-full" />
      </div>
      <div className="h-8 w-16 bg-surface rounded" />
      <div className="h-2.5 w-32 bg-surface rounded" />
    </div>
  );
}

/**
 * Structural Skeleton for Table Rows
 */
export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4 bg-card rounded-2xl border border-border animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
          <div className="h-3.5 w-36 bg-surface rounded" />
          <div className="h-3.5 w-24 bg-surface rounded" />
          <div className="h-3.5 w-48 bg-surface rounded" />
          <div className="h-5 w-16 bg-surface rounded-full" />
        </div>
      ))}
    </div>
  );
}
