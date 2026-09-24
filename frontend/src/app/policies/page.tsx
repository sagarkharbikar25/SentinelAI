'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Policy } from '@/lib/api';
import { ShieldAlert, Plus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/policies');
      if (res.data.success) {
        setPolicies(res.data.data);
      } else {
        setError('Failed to load governance policies.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to NestJS API (Port 3001).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-wide">
            <ShieldAlert className="w-6 h-6 text-blue-400" /> Security Governance Policies
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Define active DENY and REQUIRE_CONFIRMATION rules per agent type and execution tool (Member 2 — Semester 5).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPolicies}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-xs font-semibold text-slate-200 border border-[#232733] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            href="/policies/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" /> Create Policy
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-300 text-sm animate-pulse font-medium">
          Loading governance policies from NestJS Backend (Port 3001)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#232733] pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-white text-lg">{policy.name}</h3>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{policy.description}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                  Policy Security Rules ({policy.rules.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {policy.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0B0C10] border border-[#232733] flex items-center justify-between text-xs shadow-inner"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200">
                          Agent: <span className="text-blue-400 font-bold">{rule.agentType}</span> | Tool: <span className="text-purple-400 font-bold">{rule.toolName}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">Op: <code className="text-slate-200 bg-[#13151C] px-1.5 py-0.5 rounded border border-[#232733]">{rule.operation}</code></p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${
                          rule.effect === 'DENY'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {rule.effect === 'DENY' ? '⛔ DENY' : '⚠️ CONFIRM'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
