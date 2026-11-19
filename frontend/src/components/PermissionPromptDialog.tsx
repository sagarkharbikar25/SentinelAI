'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlertSvg,
  ShieldCheckSvg,
  SentinelLogoSvg,
} from '@/components/icons/SvgIcons';
import { respondToPrompt } from '@/lib/daemon';

export interface PromptAction {
  id: string;
  agentId: string;
  actionType: string;
  targetPath: string;
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasonCode: string;
  explanation: string;
  fileContext?: {
    size?: string;
    isGitTracked?: boolean;
    lastModified?: string;
    inScope?: boolean;
  };
}

interface PermissionPromptDialogProps {
  prompt: PromptAction | null;
  onClose: () => void;
  onDecisionApplied?: (outcome: string) => void;
}

export default function PermissionPromptDialog({
  prompt,
  onClose,
  onDecisionApplied,
}: PermissionPromptDialogProps) {
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!prompt) return;
    setTimeLeft(30);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDecision('BLOCK'); // Auto-block on 30s timeout as per spec
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleDecision('BLOCK'); // Default fail-closed on Enter / Esc
      } else if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDecision('ALLOW');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prompt]);

  if (!prompt) return null;

  const handleDecision = async (choice: 'ALLOW' | 'BLOCK') => {
    setSubmitting(true);
    try {
      await respondToPrompt(prompt.id, choice);
      if (onDecisionApplied) onDecisionApplied(choice);
      onClose();
    } catch (err) {
      console.error('Failed to submit prompt choice:', err);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (cat: string) => {
    switch (cat) {
      case 'CRITICAL':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'HIGH':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'MEDIUM':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="relative w-full max-w-lg rounded-xl bg-[#0D1017] border border-red-500/30 ring-1 ring-red-500/20 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#131722] px-5 py-3.5 border-b border-[#1E2536] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-red-500/15 text-red-400">
              <ShieldAlertSvg className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-heading font-bold text-white tracking-wide text-balance">
                Human confirmation required
              </h3>
              <p className="text-[11px] text-[#8A94A6]">
                SentinelAI runtime security interceptor
              </p>
            </div>
          </div>

          {/* 30s Countdown Timer & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E2536] text-xs tabular-nums">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              <span className={timeLeft <= 10 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                {timeLeft}s auto-deny
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="size-7 rounded-md bg-[#08090C] hover:bg-[#1E2536] text-[#8A94A6] hover:text-white border border-[#1E2536] flex items-center justify-center transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Action Details Grid */}
          <div className="p-3.5 rounded-lg bg-[#131722] border border-[#1E2536] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#8A94A6]">Requesting agent:</span>
              <span className="text-[#00E5FF] font-bold">{prompt.agentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8A94A6]">Action type:</span>
              <span className="text-white font-bold px-2 py-0.5 rounded bg-[#08090C] border border-[#1E2536]">
                {prompt.actionType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8A94A6]">Target resource:</span>
              <span className="text-slate-200 font-semibold max-w-[280px] truncate">
                {prompt.targetPath}
              </span>
            </div>
          </div>

          {/* Risk Level & Context */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#131722] border border-[#1E2536]">
            <div className="flex items-center gap-2">
              <span className="text-[#8A94A6]">Risk severity:</span>
              <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getRiskColor(prompt.riskCategory)}`}>
                {prompt.riskCategory} ({prompt.riskScore}/100)
              </span>
            </div>
            <span className="text-[10px] text-[#8A94A6]">Code: {prompt.reasonCode}</span>
          </div>

          {/* Explanation */}
          <div className="p-3 rounded-lg bg-[#131722] border border-[#1E2536] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Explanation</span>
            <p className="text-slate-300 text-pretty leading-relaxed">
              {prompt.explanation}
            </p>
          </div>

          {/* Visual 30s Countdown Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] text-[#8A94A6]">
              <span>Timeout countdown</span>
              <span className="tabular-nums font-bold text-white">{timeLeft}s remaining</span>
            </div>
            <div className="h-1.5 w-full bg-[#1E2536] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 10 ? 'bg-red-500' : 'bg-[#00E5FF]'
                }`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Decision Buttons with Fail-Closed Emphasis */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleDecision('BLOCK')}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold transition-colors text-xs flex items-center justify-center gap-2 focus:ring-2 focus:ring-red-500/50"
            >
              <ShieldAlertSvg className="size-4" />
              <span>Deny action (Esc / Enter)</span>
            </button>

            <button
              onClick={() => handleDecision('ALLOW')}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] font-bold transition-colors text-xs flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#00E5FF]/50"
            >
              <ShieldCheckSvg className="size-4" />
              <span>Allow (Ctrl + A)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
