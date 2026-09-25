'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPolicy } from '@/lib/daemon';
import { ShieldAlert, ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreatePolicyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState([
    { agentType: 'AUTONOMOUS', toolName: 'sentinel_canary.env', operation: 'DELETE', effect: 'DENY' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => {
    setRules([
      ...rules,
      { agentType: 'SHELL', toolName: '~/.ssh/*', operation: 'READ', effect: 'REQUIRE_CONFIRMATION' },
    ]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError('Please provide a policy name and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPolicy({ name, scope: rules[0].toolName || '*', rule: description });
      router.push('/policies');
    } catch (err: any) {
      setError(err.message || 'Daemon offline. Start the Python service on port 8765.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 border-b border-[#3F4850]/40 pb-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] text-[#89929B] hover:text-white border border-[#3F4850]/60 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[#93CCFF] animate-pulse"></span>
            GOVERNANCE RULE DESIGNER
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-[#93CCFF]" /> Create Security Governance Policy
          </h2>
          <p className="text-xs text-[#BFC7D2]">
            Define TOML policy rules and pre-execution evaluation gates for autonomous agents.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-[#FFB4AB] text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 space-y-6 font-mono shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#89929B] uppercase mb-1.5">Policy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Strict Sensitive Directory Guard"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#93CCFF]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#89929B] uppercase mb-1.5">Policy Description / Intent</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the governance rules enforced by this policy TOML..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#141824] border border-[#3F4850]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#93CCFF] resize-none"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#89929B] uppercase tracking-wider">Policy Security Rules</h4>
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#3198DC]/20 text-[#93CCFF] border border-[#93CCFF]/30 text-xs hover:bg-[#3198DC]/30 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-[#141824] border border-[#3F4850]/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
              <div>
                <label className="block text-[10px] text-[#89929B] uppercase mb-1">Agent Type</label>
                <select
                  value={rule.agentType}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].agentType = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0E131F] border border-[#3F4850]/60 text-xs text-white"
                >
                  <option value="AUTONOMOUS">AUTONOMOUS</option>
                  <option value="SHELL">SHELL</option>
                  <option value="MCP">MCP</option>
                  <option value="BROWSER">BROWSER</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#89929B] uppercase mb-1">Path Scope / Target</label>
                <input
                  type="text"
                  value={rule.toolName}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].toolName = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0E131F] border border-[#3F4850]/60 text-xs text-white"
                  placeholder="e.g. ~/.ssh/* or *.env"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#89929B] uppercase mb-1">Operation</label>
                <input
                  type="text"
                  value={rule.operation}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].operation = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0E131F] border border-[#3F4850]/60 text-xs text-white"
                  placeholder="DELETE, WRITE, READ"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-[#89929B] uppercase mb-1">Effect</label>
                  <select
                    value={rule.effect}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].effect = e.target.value as any;
                      setRules(newRules);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-[#0E131F] border border-[#3F4850]/60 text-xs text-white"
                  >
                    <option value="DENY">DENY (BLOCK)</option>
                    <option value="REQUIRE_CONFIRMATION">REQUIRE_CONFIRMATION</option>
                  </select>
                </div>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 transition mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#3F4850]/40">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] text-xs text-[#DFE2F0] font-bold border border-[#3F4850]/60 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-xs font-bold text-[#002C47] shadow-md transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Writing TOML Policy...' : 'Save Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}
