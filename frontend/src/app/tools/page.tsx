'use client';

import React, { useEffect, useState } from 'react';
import { api, SystemTool } from '@/lib/api';
import { Wrench, Shield, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ToolsPage() {
  const [tools, setTools] = useState<SystemTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tools');
      if (res.data.success) {
        setTools(res.data.data);
      } else {
        setError('Failed to load system tools.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to NestJS API (Port 3001).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-wide">
            <Wrench className="w-6 h-6 text-purple-400" /> System Tools Registry
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Registered agent tools, execution capabilities, risk levels, and permission gates (Member 2 — Semester 5).
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
          Loading system tools from NestJS Backend (Port 3001)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 rounded-2xl bg-[#13151C] border border-[#232733] hover:border-slate-600 transition duration-200 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                  {tool.name}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRiskBadge(tool.riskLevel)}`}>
                  {tool.riskLevel} RISK
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">{tool.description}</p>

              <div className="pt-3 border-t border-[#232733] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 font-medium">
                  <Shield className="w-3.5 h-3.5 text-blue-400" /> Perm: {tool.requiredPermission}
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
