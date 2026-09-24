'use client';

import React, { useEffect, useState } from 'react';
import { Wrench, Shield, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getTools, ToolItem } from '@/lib/daemon';

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      setTools(await getTools());
    } catch (err: any) {
      setError(err.message || 'Daemon offline. Start the Python service on port 8765.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const getRiskBadge = (level: string) => {
    return level === 'Blocked' ? 'bg-red-500/20 text-[#FFB4AB] border-red-500/40' : 'bg-emerald-500/20 text-[#4EDEA3] border-emerald-500/40';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="portal-label text-[#93CCFF]">MANIFEST PERMISSION SURFACE</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wide mt-1">
            <Wrench className="w-6 h-6 text-[#93CCFF]" /> System Tools Registry
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Registered tools loaded from the daemon manifest directory.
          </p>
        </div>
        <button
          onClick={fetchTools}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-xs font-semibold text-slate-200 border border-[#232733] transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-300 text-sm animate-pulse font-medium">
            Loading tools from Sentinel daemon (Port 8765)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="portal-card p-5 hover:border-[#93CCFF]/60 transition duration-200 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base tracking-wide flex items-center gap-2 font-mono">
                  {tool.name}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${getRiskBadge(tool.status)}`}>
                  {tool.status}
                </span>
              </div>
              <p className="text-xs text-[#BFC7D2] leading-relaxed font-normal">Owner: {tool.owner}</p>

              <div className="pt-3 border-t border-[#232733] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 font-medium">
                  <Shield className="w-3.5 h-3.5 text-[#93CCFF]" /> Manifest verified
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
