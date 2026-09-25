'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Radar, Activity, Terminal, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number; // ms to show
}

export default function SplashScreen({ onComplete, minDuration = 900 }: SplashScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  const steps = [
    'CONNECTING TO SENTINEL DAEMON (127.0.0.1:8765)...',
    'MOUNTING SQLITE DATABASE (~/.sentinelai/sentinel.db)...',
    'ARMING CANARY HONEYPOT TRIPWIRES...',
    'SYNCING IMMUTABLE AUDIT FLIGHT RECORDER...',
    'READY // INITIALIZING SOC COMMAND INTERFACE',
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070A11] text-white font-mono select-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">
        {/* Emblem with Pulsing Radar Rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border border-[#93CCFF]/20 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full border border-[#4EDEA3]/30 animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#181B25] to-[#0A0E17] border-2 border-[#93CCFF]/60 flex items-center justify-center text-[#93CCFF] shadow-[0_0_30px_rgba(147,204,255,0.3)]">
            <Shield className="w-8 h-8 text-[#93CCFF]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#93CCFF] tracking-widest uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-pulse" />
            <span>SENTINEL AI // DEFENSE SYSTEM</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-wider">
            SOC RUNTIME BROKER
          </h1>
          <p className="text-xs text-[#89929B] font-sans">
            AI Agent Security, Permission Gating &amp; Runtime Interception
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 rounded-full bg-[#141824] border border-[#3F4850]/40 overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3198DC] via-[#93CCFF] to-[#4EDEA3] transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#89929B]">
            <span>INITIALIZING TELEMETRY</span>
            <span className="text-[#93CCFF] font-bold">{Math.min(100, progress)}%</span>
          </div>
        </div>

        {/* Diagnostic Status Line */}
        <div className="w-full p-2.5 rounded-lg bg-[#0E131F] border border-[#3F4850]/40 flex items-center gap-2 text-left">
          <Terminal className="w-3.5 h-3.5 text-[#93CCFF] shrink-0" />
          <span className="text-[10px] text-[#DFE2F0] truncate font-bold">
            {steps[stepIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
