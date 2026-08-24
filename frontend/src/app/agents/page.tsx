'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Agent } from '@/lib/api';
import { Bot, Plus, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight, Shield } from 'lucide-react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/agents');
      if (res.data.success) {
        setAgents(res.data.data);
      } else {
        setError('Failed to load AI agents.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to NestJS API (Port 3001).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
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
            <Bot className="w-6 h-6 text-blue-400" /> AI Agent Registry
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Managed enterprise AI agents, security risk scores, and execution capability bindings (Member 1 — Semester 5).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-xs font-semibold text-slate-200 border border-[#232733] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            href="/agents/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" /> Register AI Agent
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-300 text-sm animate-pulse font-medium">
          Loading AI agents from NestJS Backend (Port 3001)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-5 rounded-2xl bg-[#13151C] border border-[#232733] hover:border-slate-600 transition duration-200 space-y-3.5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base tracking-wide">{agent.name}</h3>
                    <span className="text-[11px] font-mono text-blue-400 font-semibold">{agent.type} AGENT</span>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRiskBadge(agent.riskLevel)}`}>
                  {agent.riskLevel} RISK
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-normal">{agent.description}</p>

              <div className="pt-3 border-t border-[#232733] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> {agent.status}
                </span>
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold transition"
                >
                  View Agent Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
