'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number; // ms to show
}

export default function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  const steps = [
    'Probing local security daemon (127.0.0.1:8765)...',
    'Mounting SQLite audit ledger (~/.sentinelai/sentinel.db)...',
    'Synchronizing cryptographic vault & SHA-256 anchors...',
    'Calibrating deterministic policy engine...',
    'Workstation runtime perimeter armed',
  ];

  useEffect(() => {
    const startTime = Date.now();
    const stepDuration = minDuration / steps.length;

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / minDuration) * 100), 98);
      setProgress(pct);
    }, 40);

    const finishTimer = setTimeout(() => {
      setProgress(100);
      setStepIndex(steps.length - 1);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 350);
      }, 150);
    }, minDuration);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onComplete, steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[150] flex flex-col items-center justify-center bg-canvas text-ink-1 select-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-sm px-6 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Emblem with Ambient Radial Glow */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-brand/20 blur-xl animate-pulse" />
          <div className="relative size-24 rounded-card bg-surface border border-line shadow-card flex items-center justify-center p-3.5 ring-1 ring-brand/20">
            <Image
              src="/logo.png"
              alt="SentinelAI Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-display font-extrabold text-ink-1 tracking-tight text-balance">
              Sentinel<span className="text-brand">AI</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-brand-soft text-brand-ink font-bold">
              v0.1
            </span>
          </div>
          <p className="text-xs text-ink-3 text-pretty max-w-xs font-mono">
            Autonomous agent permission broker &amp; audit plane
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-3 pt-2">
          <div className="h-2 w-full bg-well rounded-pill overflow-hidden border border-line">
            <div
              className="h-full bg-gradient-to-r from-brand to-sky rounded-pill transition-all duration-75 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-ink-3 tabular-nums">
            <span className="truncate max-w-[240px] text-left">{steps[stepIndex]}</span>
            <span className="font-bold text-ink-1">{Math.min(progress, 100)}%</span>
          </div>
        </div>

        {/* Checklist pill */}
        <div className="px-3.5 py-1.5 rounded-pill bg-well/90 border border-line text-[10px] font-mono text-ink-2 flex items-center gap-2">
          <span className="size-2 rounded-full bg-safe animate-pulse" />
          <span>Local Sovereign Runtime · Zero Cloud Dependency</span>
        </div>
      </div>
    </div>
  );
}
