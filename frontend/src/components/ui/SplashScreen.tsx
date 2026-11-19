'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number; // ms to show
}

export default function SplashScreen({ onComplete, minDuration = 1000 }: SplashScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  const steps = [
    'Connecting to local security daemon (127.0.0.1:8765)...',
    'Mounting SQLite audit ledger (~/.sentinelai/sentinel.db)...',
    'Synchronizing cryptographic vault and baseline state...',
    'Calibrating deterministic policy engine...',
    'Workstation ready',
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, minDuration / steps.length);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 120);

    const finishTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 350);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas text-text-primary select-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-sm px-6 flex flex-col items-center text-center space-y-6">
        {/* Brand Emblem */}
        <div className="relative size-20 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center p-2">
          <Image
            src="/logo.png"
            alt="SentinelAI Logo"
            width={64}
            height={64}
            className="object-cover rounded-xl"
            priority
          />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-extrabold text-text-primary tracking-tight text-balance">
            Sentinel<span className="text-accent">AI</span>
          </h1>
          <p className="text-xs text-text-secondary text-pretty">
            Autonomous agent permission broker &amp; audit plane
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-3 pt-2">
          <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted tabular-nums">
            <span className="truncate max-w-[240px] text-left">{steps[stepIndex]}</span>
            <span className="font-bold text-text-primary">{Math.min(progress, 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
