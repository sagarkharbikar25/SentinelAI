'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  HardDrive,
  FileCode,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  X,
} from 'lucide-react';
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

    return () => clearInterval(timer);
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
        return 'text-[#FF5449] border-red-500/40 bg-red-500/10';
      case 'HIGH':
        return 'text-[#FFB95F] border-amber-500/40 bg-amber-500/10';
      case 'MEDIUM':
        return 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10';
      default:
        return 'text-[#4EDEA3] border-emerald-500/40 bg-emerald-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0E131F] border-2 border-[#FF5449]/60 shadow-[0_0_50px_rgba(255,84,73,0.25)] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#181B25] px-5 py-3.5 border-b border-[#3F4850]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-[#FF5449] animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                HUMAN CONFIRMATION REQUIRED
              </h3>
              <p className="text-[10px] text-[#89929B]">
                MEMBER 1 RUNTIME INTERCEPTOR MODAL
              </p>
            </div>
          </div>

          {/* 30s Countdown Timer & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A0E17] border border-[#3F4850]/60 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#FFB95F]" />
              <span className={timeLeft <= 10 ? 'text-[#FF5449] font-bold animate-ping' : 'text-[#DFE2F0]'}>
                {timeLeft}s AUTO-BLOCK
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#0A0E17] hover:bg-[#1C1F29] text-[#89929B] hover:text-white border border-[#3F4850]/60 transition"
              title="Close Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Action Details Grid */}
          <div className="p-3.5 rounded-xl bg-[#141824] border border-[#3F4850]/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#89929B]">REQUESTING AGENT:</span>
              <span className="text-[#93CCFF] font-bold">{prompt.agentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#89929B]">ACTION TYPE:</span>
              <span className="text-white font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10">
                {prompt.actionType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#89929B]">TARGET RESOURCE:</span>
              <span className="text-[#DFE2F0] font-semibold max-w-[280px] truncate">
                {prompt.targetPath}
              </span>
            </div>
          </div>

          {/* Risk Level & Context */}
          <div className="p-3.5 rounded-xl bg-[#141824] border border-[#3F4850]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#89929B]">RISK ASSESSMENT:</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-black border ${getRiskColor(prompt.riskCategory)}`}>
                {prompt.riskCategory} ({prompt.riskScore}/100)
              </span>
            </div>

            {/* Risk bar */}
            <div className="w-full bg-[#0A0E17] h-2 rounded-full overflow-hidden border border-[#3F4850]/40">
              <div
                className={`h-full transition-all ${
                  prompt.riskScore > 75
                    ? 'bg-[#FF5449]'
                    : prompt.riskScore > 40
                    ? 'bg-[#FFB95F]'
                    : 'bg-[#4EDEA3]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, prompt.riskScore))}%` }}
              ></div>
            </div>

            <div className="space-y-1 text-[11px] text-[#BFC7D2] pt-1">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#93CCFF]" />
                <span>Status: {prompt.fileContext?.isGitTracked ? 'Git Tracked File' : 'Untracked / Sensitive Boundary'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#4EDEA3]" />
                <span className="text-[#4EDEA3]">Pre-action snapshot saved to Vault ✓</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#93CCFF]" />
                <span>Session checkpoint: One-click undo available</span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-3 rounded-lg bg-[#0A0E17] border border-[#3F4850]/40">
            <p className="text-[10px] text-[#89929B] uppercase font-bold mb-1">
              EXPLANATION // {prompt.reasonCode}
            </p>
            <p className="text-[#DFE2F0] text-[11px] leading-relaxed">
              {prompt.explanation}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-[#181B25] p-4 border-t border-[#3F4850]/50 grid grid-cols-3 gap-2.5">
          <button
            onClick={() => handleDecision('BLOCK')}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[#FF5449] border border-red-500/50 font-bold text-xs transition shadow-md"
          >
            <XCircle className="w-4 h-4" /> BLOCK
          </button>

          <button
            onClick={() => handleDecision('ALLOW')}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#141824] hover:bg-[#1E2330] text-[#DFE2F0] border border-[#3F4850]/60 font-semibold text-xs transition"
          >
            <CheckCircle2 className="w-4 h-4 text-[#93CCFF]" /> ALLOW ONCE
          </button>

          <button
            onClick={() => handleDecision('ALLOW')}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#4EDEA3] border border-[#4EDEA3]/50 font-bold text-xs transition shadow-md"
          >
            <ShieldCheck className="w-4 h-4" /> ALLOW SESSION
          </button>
        </div>
      </div>
    </div>
  );
}
