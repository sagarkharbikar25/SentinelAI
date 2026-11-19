'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlertSvg,
  ShieldCheckSvg,
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
        return 'text-accent-rose border-accent-rose/40 bg-accent-rose/15';
      case 'HIGH':
        return 'text-accent-amber border-accent-amber/40 bg-accent-amber/15';
      case 'MEDIUM':
        return 'text-yellow-400 border-yellow-400/40 bg-yellow-400/15';
      default:
        return 'text-accent-emerald border-accent-emerald/40 bg-accent-emerald/15';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="bg-surface px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-accent-rose/15 text-accent-rose border border-accent-rose/30">
              <ShieldAlertSvg className="size-5" />
            </span>
            <div>
              <h3 id="prompt-title" className="text-sm font-heading font-bold text-text-primary tracking-tight text-balance">
                Human confirmation required
              </h3>
              <p className="text-[11px] text-text-muted">
                SentinelAI runtime security interceptor
              </p>
            </div>
          </div>

          {/* 30s Countdown Timer & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs tabular-nums shadow-xs">
              <span className="size-2 rounded-full bg-accent-amber animate-pulse" />
              <span className={timeLeft <= 10 ? 'text-accent-rose font-bold' : 'text-text-primary font-medium'}>
                {timeLeft}s auto-deny
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close confirmation dialog"
              className="size-7 rounded-lg bg-surface hover:bg-card-hover text-text-muted hover:text-text-primary border border-border flex items-center justify-center transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Action Details Grid */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Requesting agent:</span>
              <span className="text-accent font-bold">{prompt.agentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Action type:</span>
              <span className="text-text-primary font-semibold px-2 py-0.5 rounded bg-card border border-border">
                {prompt.actionType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Target resource:</span>
              <span className="text-text-primary font-medium max-w-[280px] truncate" title={prompt.targetPath}>
                {prompt.targetPath}
              </span>
            </div>
          </div>

          {/* Risk Level & Context */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Risk severity:</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getRiskColor(prompt.riskCategory)}`}>
                {prompt.riskCategory} ({prompt.riskScore}/100)
              </span>
            </div>
            <span className="text-[10px] text-text-muted">Code: {prompt.reasonCode}</span>
          </div>

          {/* Explanation */}
          <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-muted">Explanation</span>
            <p className="text-text-secondary text-pretty leading-relaxed">
              {prompt.explanation}
            </p>
          </div>

          {/* Visual 30s Countdown Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>Timeout countdown</span>
              <span className="tabular-nums font-bold text-text-primary">{timeLeft}s remaining</span>
            </div>
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 10 ? 'bg-accent-rose' : 'bg-accent-emerald'
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
              className="flex-1 py-3 rounded-xl bg-accent-rose hover:opacity-90 text-white font-bold transition-opacity text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              <ShieldAlertSvg className="size-4" />
              <span>Deny action (Esc / Enter)</span>
            </button>

            <button
              onClick={() => handleDecision('ALLOW')}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-surface hover:bg-card-hover border border-border text-text-primary font-medium transition-colors text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheckSvg className="size-4 text-accent-emerald" />
              <span>Allow (Ctrl + A)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
