'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Agent } from '@/lib/api';
import { Bot, ArrowLeft, Shield, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await api.get(`/agents/${agentId}`);
        if (res.data.success) {
          setAgent(res.data.data);
        } else {
          setError('Agent not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load agent details.');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) fetchAgent();
  }, [agentId]);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-slate-400 hover:text-white border border-[#232733] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" /> AI Agent Details
          </h2>
          <p className="text-xs text-slate-300">Agent capability profile, risk assessment, and tool bindings.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-300 text-sm animate-pulse font-medium">
          Loading agent details from NestJS Backend (Port 3001)...
        </div>
      ) : error || !agent ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5" /> {error || 'Agent not found.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232733] pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-white">{agent.name}</h3>
                <p className="text-xs font-mono text-blue-400 font-semibold pt-1">ID: {agent.id} | TYPE: {agent.type}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {agent.status}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">{agent.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-[#0B0C10] border border-[#232733]">
                <p className="text-[11px] text-slate-400 font-semibold">Baseline Risk Level</p>
                <p className="text-sm font-bold text-amber-400 pt-0.5">{agent.riskLevel} RISK</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0C10] border border-[#232733]">
                <p className="text-[11px] text-slate-400 font-semibold">Registered Owner</p>
                <p className="text-sm font-bold text-purple-400 font-mono pt-0.5">{agent.ownerId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
