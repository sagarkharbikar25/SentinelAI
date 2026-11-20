'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface NavigationContextType {
  isNavigating: boolean;
  destination: string | null;
  startNavigation: (href: string, title?: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  destination: null,
  startNavigation: () => {},
});

export const useNavigationLoader = () => useContext(NavigationContext);

const routeDescriptions: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Runtime Security Overview', subtitle: 'Calibrating deterministic policy engine & real-time telemetry...' },
  '/vault': { title: 'Backup Vault Explorer', subtitle: 'Mounting content-addressed storage & shadow file revisions...' },
  '/audit-logs': { title: 'Log & Audit Flight Recorder', subtitle: 'Verifying SHA-256 cryptographic chain & SQLite ledger...' },
  '/lab': { title: 'Test Lab & Chaos Matrix', subtitle: 'Preparing deterministic payload vectors & test isolation...' },
  '/settings': { title: 'System Settings', subtitle: 'Loading governance configurations & workspace preferences...' },
};

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = (href: string, explicitTitle?: string) => {
    // Only trigger if navigating to a different page
    if (href === pathname) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);

    setTargetPath(href);
    setIsNavigating(true);
    setProgress(15);

    const startTime = Date.now();
    const duration = 2000; // Minimum 2000ms duration

    animIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 98);
      setProgress(pct);
    }, 50);

    timerRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setTargetPath(null);
        setProgress(0);
      }, 250);
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    }, duration);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, []);

  const routeInfo = targetPath ? routeDescriptions[targetPath] : routeDescriptions[pathname] || {
    title: 'Workstation Loading',
    subtitle: 'Synchronizing agent state...',
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, destination: targetPath, startNavigation }}>
      {children}

      {/* Global Navigation Loading Screen - Guarantees minimum 2.0s display */}
      {isNavigating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-md select-none animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md px-6 flex flex-col items-center text-center space-y-6">
            {/* Logo with Ambient Breathing Glow */}
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-brand/20 blur-xl animate-pulse" />
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

            {/* Brand Title & Route Context */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <span className="font-display font-extrabold text-2xl tracking-tight text-ink-1">
                  Sentinel<span className="text-brand">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-brand-soft text-brand-ink font-semibold">
                  v0.1
                </span>
              </div>
              <h2 className="text-sm font-semibold text-ink-1 tracking-tight">
                {routeInfo.title}
              </h2>
              <p className="text-xs text-ink-3 font-mono">
                {routeInfo.subtitle}
              </p>
            </div>

            {/* Progress Bar (2-second calibrated duration) */}
            <div className="w-full max-w-xs space-y-2 pt-2">
              <div className="h-2 w-full bg-well rounded-pill overflow-hidden border border-line">
                <div
                  className="h-full bg-gradient-to-r from-brand to-sky rounded-pill transition-all duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-3 tabular-nums">
                <span>Synchronizing runtime telemetry</span>
                <span className="font-bold text-ink-1">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}
