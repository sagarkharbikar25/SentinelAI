import React from 'react';
import { Shield, Terminal } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center font-mono select-none space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full border border-[#93CCFF]/30 animate-ping" />
        <div className="absolute w-20 h-20 rounded-full border border-[#4EDEA3]/30 animate-pulse" />
        <div className="w-14 h-14 rounded-2xl bg-[#141824] border-2 border-[#93CCFF]/60 flex items-center justify-center text-[#93CCFF] shadow-[0_0_25px_rgba(147,204,255,0.25)]">
          <Shield className="w-7 h-7 text-[#93CCFF]" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-[10px] text-[#93CCFF] tracking-widest uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3] animate-pulse" />
          <span>LOADING TELEMETRY INGRESS</span>
        </div>
        <p className="text-xs text-[#89929B]">
          Synchronizing with local Sentinel security daemon...
        </p>
      </div>

      <div className="w-48 h-1 rounded-full bg-[#181B25] overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-[#3198DC] to-[#93CCFF] animate-[indeterminate_1.2s_infinite_linear]" />
      </div>
    </div>
  );
}
