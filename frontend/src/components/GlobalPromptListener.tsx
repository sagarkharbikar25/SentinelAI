'use client';

import React, { useState, useEffect, useRef } from 'react';
import PermissionPromptDialog, { PromptAction } from '@/components/PermissionPromptDialog';
import { getPendingPrompts } from '@/lib/daemon';
import { useDaemon } from '@/context/DaemonContext';

export default function GlobalPromptListener() {
  const { status } = useDaemon();
  const isOnline = status === 'online';
  const [activePrompt, setActivePrompt] = useState<PromptAction | null>(null);
  const dismissedPromptsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isOnline) {
      setActivePrompt(null);
      return;
    }

    let isMounted = true;

    const checkPendingPrompts = async () => {
      try {
        const res = await getPendingPrompts();
        if (!isMounted) return;

        if (res.prompts && res.prompts.length > 0) {
          const nextPrompt = res.prompts.find((p) => !dismissedPromptsRef.current.has(p.id));
          if (nextPrompt) {
            setActivePrompt((curr) => {
              if (!curr || curr.id !== nextPrompt.id) {
                return nextPrompt as PromptAction;
              }
              return curr;
            });
          } else {
            setActivePrompt(null);
          }
        } else {
          setActivePrompt(null);
        }
      } catch {
        // Daemon may be briefly busy or restarting
      }
    };

    // Immediate check on mount & fast 1.5s interval for responsive live presentation
    checkPendingPrompts();
    const interval = setInterval(checkPendingPrompts, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOnline]);

  if (!activePrompt) return null;

  return (
    <PermissionPromptDialog
      prompt={activePrompt}
      onClose={() => {
        if (activePrompt) dismissedPromptsRef.current.add(activePrompt.id);
        setActivePrompt(null);
      }}
      onDecisionApplied={() => {
        if (activePrompt) dismissedPromptsRef.current.add(activePrompt.id);
        setActivePrompt(null);
      }}
    />
  );
}
