'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPolicies, PolicyItem } from '@/lib/daemon';
import { ShieldAlert, Plus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      setPolicies(await getPolicies());
    } catch (err: any) {
      setError(err.message || 'Daemon offline. Start the Python service on port 8765.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="portal-label text-[#93CCFF]">POLICY ENGINE // TOML AUTHORITY</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wide mt-1">
            <ShieldAlert className="w-6 h-6 text-[#93CCFF]" /> Security Governance Policies
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Live policy rules evaluated by the Sentinel daemon before an agent action executes.
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
            Loading policies from Sentinel daemon (Port 8765)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={`${policy.name}-${policy.scope}`}
              className="portal-card p-5 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#3F4850]/50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-white text-lg">{policy.name}</h3>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 text-[#4EDEA3] border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-[#BFC7D2] font-mono">Scope: {policy.scope}</p>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 rounded border text-[10px] font-bold ${policy.action === 'DENY' ? 'text-[#FFB4AB] border-[#FFB4AB]/40 bg-[#93000A]/25' : 'text-[#FFB95F] border-[#FFB95F]/40 bg-[#CA8100]/20'}`}>{policy.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
