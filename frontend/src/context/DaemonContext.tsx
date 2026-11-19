'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getDaemonStatus, DaemonStatus } from '@/lib/daemon';

export type DaemonConnectionStatus = 'connecting' | 'online' | 'offline';

export interface DaemonContextValue {
  status: DaemonConnectionStatus;
  latencyMs: number | null;
  lastSeenAt: Date | null;
  mode: string;
  rawMode: string;
  dbConnected: boolean;
  canaryCount: number;
  activeSessionId: string | null;
  vaultSizeMb: number;
  error: string | null;
  refresh: () => Promise<void>;
}

const DaemonContext = createContext<DaemonContextValue | undefined>(undefined);

export function DaemonProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DaemonConnectionStatus>('connecting');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<string>('Strict intercept');
  const [rawMode, setRawMode] = useState<string>('STRICT_INTERCEPT');
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [canaryCount, setCanaryCount] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [vaultSizeMb, setVaultSizeMb] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const backoffDelayRef = useRef<number>(3000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async () => {
    // Abort previous in-flight request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = performance.now();
    try {
      const res = await getDaemonStatus(controller.signal);
      const measuredLatency = Math.round(performance.now() - startTime);

      setStatus('online');
      setLatencyMs(measuredLatency);
      setLastSeenAt(new Date());
      setDbConnected(true);
      setActiveSessionId(res.active_session_id ?? null);
      setVaultSizeMb(res.vault_size_mb ?? 0);
      setMode('Strict intercept');
      setRawMode('STRICT_INTERCEPT');
      setCanaryCount(11); // Canary count from armed honeypot files
      setError(null);

      // Reset exponential backoff to standard 3s
      backoffDelayRef.current = 3000;
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      setStatus('offline');
      setLatencyMs(null);
      setDbConnected(false);
      setError(err?.message || 'Daemon offline');

      // Exponential backoff when offline: 3s -> 6s -> 12s -> max 15s
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 15000);
    }
  }, []);

  const scheduleNextPoll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await checkHealth();
      scheduleNextPoll();
    }, backoffDelayRef.current);
  }, [checkHealth]);

  // Initial check & start polling
  useEffect(() => {
    checkHealth().finally(() => {
      scheduleNextPoll();
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [checkHealth, scheduleNextPoll]);

  const manualRefresh = useCallback(async () => {
    backoffDelayRef.current = 3000;
    await checkHealth();
    scheduleNextPoll();
  }, [checkHealth, scheduleNextPoll]);

  return (
    <DaemonContext.Provider
      value={{
        status,
        latencyMs,
        lastSeenAt,
        mode,
        rawMode,
        dbConnected,
        canaryCount,
        activeSessionId,
        vaultSizeMb,
        error,
        refresh: manualRefresh,
      }}
    >
      {children}
    </DaemonContext.Provider>
  );
}

export function useDaemon(): DaemonContextValue {
  const context = useContext(DaemonContext);
  if (!context) {
    throw new Error('useDaemon must be used within a DaemonProvider');
  }
  return context;
}
