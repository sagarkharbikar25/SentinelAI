'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPolicies, interceptAction, PolicyItem } from '@/lib/daemon';
import {
  ShieldAlert,
  Plus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sliders,
  Play,
  FileCode,
} from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testingPolicy, setTestingPolicy] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { decision: string; risk: number; reason: string }>>({});

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

  const handleTestPolicy = async (policy: PolicyItem) => {
    setTestingPolicy(policy.name);
    try {
      const res = await interceptAction({
        agent_id: 'policy-test-agent',
        agent_type: 'AUTONOMOUS',
        action_type: 'FILE_DELETE',
        operation: 'DELETE',
        target_path: policy.scope === '*' ? 'test_scope_file.env' : policy.scope.replace(/\*/g, 'test_target'),
        command: `policy_test ${policy.name}`,
      });
      setTestResults((prev) => ({
        ...prev,
        [policy.name]: {
          decision: res.decision,
          risk: res.risk_score,
          reason: res.reason_code,
        },
      }));
    } catch (err: any) {
      console.error('Failed to test policy:', err);
    } finally {
      setTestingPolicy(null);
    }
  };

  const filteredPolicies = policies.filter(
    (p) =>
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">POLICY ENGINE // TOML GOVERNANCE AUTHORITY</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wide mt-1">
            <ShieldAlert className="w-6 h-6 text-[#93CCFF]" /> Security Governance Policies
          </h2>
          <p className="text-xs text-[#BFC7D2] font-medium mt-1">
            Live policy rules loaded from <code className="text-[#93CCFF]">policies/*.toml</code> and evaluated deterministically by the Sentinel daemon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPolicies}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] text-xs font-mono font-semibold text-[#DFE2F0] border border-[#3F4850]/60 hover:border-[#93CCFF] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#93CCFF] ${loading ? 'animate-spin' : ''}`} /> REFRESH RULES
          </button>
          <Link
            href="/policies/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] font-mono font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" /> CREATE POLICY
          </Link>
        </div>
      </div>

      {/* Search & Info Bar */}
      <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg flex items-center justify-between gap-4 font-mono">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#89929B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search policies, scopes, rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-[#3F4850]/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#93CCFF]"
          />
        </div>
        <span className="text-xs text-[#89929B]">
          {filteredPolicies.length} OF {policies.length} ACTIVE POLICIES
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#89929B] text-sm animate-pulse font-mono">
          Loading policies from Sentinel daemon (Port 8765)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-mono">
          <AlertCircle className="w-5 h-5 text-red-400" /> {error}
        </div>
      ) : (
        <div className="space-y-3 font-mono">
          {filteredPolicies.map((policy) => {
            const result = testResults[policy.name];
            const isTesting = testingPolicy === policy.name;

            return (
              <div
                key={`${policy.name}-${policy.scope}`}
                className="p-5 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 hover:border-[#93CCFF]/50 transition duration-200 shadow-xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3F4850]/40 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-white text-base tracking-wide">{policy.name}</h3>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/10 text-[#4EDEA3] border border-[#4EDEA3]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-[#BFC7D2]">
                      Target Scope: <code className="text-[#93CCFF] px-1.5 py-0.5 rounded bg-[#181B25] border border-[#3F4850]/40">{policy.scope}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded border text-[10px] font-extrabold uppercase tracking-wider ${
                        policy.action === 'DENY' || policy.action === 'BLOCK'
                          ? 'text-[#FFB4AB] border-[#FFB4AB]/40 bg-[#93000A]/25'
                          : policy.action.includes('CONFIRM') || policy.action.includes('PROMPT')
                          ? 'text-[#FFB95F] border-[#FFB95F]/40 bg-[#CA8100]/20'
                          : 'text-[#4EDEA3] border-[#4EDEA3]/40 bg-emerald-500/15'
                      }`}
                    >
                      {policy.action}
                    </span>

                    <button
                      onClick={() => handleTestPolicy(policy)}
                      disabled={isTesting}
                      className="px-3 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/60 hover:border-[#93CCFF] text-xs font-bold text-[#93CCFF] flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'TESTING...' : 'TEST RULE'}
                    </button>
                  </div>
                </div>

                {/* Test Feedback */}
                {result && (
                  <div
                    className={`p-3 rounded-lg border text-xs ${
                      result.decision === 'ALLOW'
                        ? 'bg-emerald-500/10 border-[#4EDEA3]/40 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/40 text-red-300'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>DECISION: {result.decision}</span>
                      <span>RISK EVALUATION: {result.risk}/100</span>
                    </div>
                    <p className="text-[11px] text-[#DFE2F0] mt-1">Rule Trigger: {result.reason}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!filteredPolicies.length && (
            <div className="p-12 text-center text-[#89929B] font-mono space-y-2">
              <p className="text-sm font-semibold text-white">No Matching Policies Found</p>
              <p className="text-xs">
                Create a new policy using the button above or ensure policies exist in <code className="text-[#93CCFF]">policies/</code>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
