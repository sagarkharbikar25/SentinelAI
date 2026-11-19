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
        return 'text-red-700 border-red-200 bg-red-50';
      case 'HIGH':
        return 'text-amber-800 border-amber-200 bg-amber-50';
      case 'MEDIUM':
        return 'text-yellow-800 border-yellow-200 bg-yellow-50';
      default:
        return 'text-emerald-700 border-emerald-200 bg-emerald-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 font-mono select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-[#F9FAF9] px-6 py-4 border-b border-[#E2EAE4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
              <ShieldAlertSvg className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#111915] tracking-tight text-balance">
                Human confirmation required
              </h3>
              <p className="text-[11px] text-[#536459]">
                SentinelAI runtime security interceptor
              </p>
            </div>
          </div>

          {/* 30s Countdown Timer & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E2EAE4] text-xs tabular-nums shadow-xs">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span className={timeLeft <= 10 ? 'text-red-700 font-bold' : 'text-[#111915] font-medium'}>
                {timeLeft}s auto-deny
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="size-7 rounded-lg bg-[#FFFFFF] hover:bg-[#F2F6F3] text-[#536459] hover:text-[#111915] border border-[#E2EAE4] flex items-center justify-center transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Action Details Grid */}
          <div className="p-4 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[#75887B]">Requesting agent:</span>
              <span className="text-[#059669] font-bold">{prompt.agentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#75887B]">Action type:</span>
              <span className="text-[#111915] font-semibold px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E2EAE4]">
                {prompt.actionType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#75887B]">Target resource:</span>
              <span className="text-[#111915] font-medium max-w-[280px] truncate" title={prompt.targetPath}>
                {prompt.targetPath}
              </span>
            </div>
          </div>

          {/* Risk Level & Context */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2EAE4]">
            <div className="flex items-center gap-2">
              <span className="text-[#75887B]">Risk severity:</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getRiskColor(prompt.riskCategory)}`}>
                {prompt.riskCategory} ({prompt.riskScore}/100)
              </span>
            </div>
            <span className="text-[10px] text-[#75887B]">Code: {prompt.reasonCode}</span>
          </div>

          {/* Explanation */}
          <div className="p-3.5 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#75887B]">Explanation</span>
            <p className="text-[#536459] text-pretty leading-relaxed">
              {prompt.explanation}
            </p>
          </div>

          {/* Visual 30s Countdown Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] text-[#75887B]">
              <span>Timeout countdown</span>
              <span className="tabular-nums font-bold text-[#111915]">{timeLeft}s remaining</span>
            </div>
            <div className="h-1.5 w-full bg-[#E2EAE4] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 10 ? 'bg-red-500' : 'bg-[#059669]'
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
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              <ShieldAlertSvg className="size-4" />
              <span>Deny action (Esc / Enter)</span>
            </button>

            <button
              onClick={() => handleDecision('ALLOW')}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-[#F4F7F5] hover:bg-[#EAF0EB] border border-[#E2EAE4] text-[#111915] font-medium transition-colors text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheckSvg className="size-4 text-[#059669]" />
              <span>Allow (Ctrl + A)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
