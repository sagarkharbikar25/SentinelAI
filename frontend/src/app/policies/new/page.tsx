'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ShieldAlert, ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreatePolicyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState([
    { agentType: 'DATABASE', toolName: 'EXECUTE_SQL', operation: 'DROP_TABLE', effect: 'DENY' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => {
    setRules([...rules, { agentType: 'EMAIL', toolName: 'SEND_EMAIL', operation: 'BULK_SEND', effect: 'REQUIRE_CONFIRMATION' }]);
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
      const res = await api.post('/policies', {
        name,
        description,
        isActive: true,
        rules,
      });

      if (res.data.success) {
        router.push('/policies');
      } else {
        setError('Failed to create policy.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error submitting policy.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-[#16181D] hover:bg-[#1E2027] text-gray-400 hover:text-white border border-[#262933] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" /> Create Security Governance Policy
          </h2>
          <p className="text-xs text-gray-400">Define policy rules for AI Agent execution gates (Member 2 — Semester 5).</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#16181D] border border-[#262933] space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Policy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Strict Database Guard Policy"
              className="w-full px-3.5 py-2 rounded-lg bg-[#0D0E12] border border-[#262933] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Policy Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the governance rules enforced by this policy..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0D0E12] border border-[#262933] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Policy Security Rules</h4>
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs hover:bg-blue-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-[#0D0E12] border border-[#262933] grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Agent Type</label>
                <select
                  value={rule.agentType}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].agentType = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#16181D] border border-[#262933] text-xs text-white"
                >
                  <option value="RESEARCH">RESEARCH</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="CODING">CODING</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Tool Name</label>
                <input
                  type="text"
                  value={rule.toolName}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].toolName = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#16181D] border border-[#262933] text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Operation</label>
                <input
                  type="text"
                  value={rule.operation}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[idx].operation = e.target.value;
                    setRules(newRules);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[#16181D] border border-[#262933] text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-1">Effect</label>
                  <select
                    value={rule.effect}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].effect = e.target.value as any;
                      setRules(newRules);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-[#16181D] border border-[#262933] text-xs text-white"
                  >
                    <option value="DENY">DENY</option>
                    <option value="REQUIRE_CONFIRMATION">REQUIRE_CONFIRMATION</option>
                  </select>
                </div>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-2 text-gray-500 hover:text-red-400 transition mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#262933]">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-[#16181D] hover:bg-[#1E2027] text-xs text-gray-300 font-medium border border-[#262933] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Saving Policy...' : 'Save Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}
