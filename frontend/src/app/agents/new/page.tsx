'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Bot, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateAgentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'RESEARCH' | 'EMAIL' | 'DATABASE' | 'CODING'>('CODING');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError('Please provide an agent name and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/agents', {
        name,
        description,
        type,
        riskLevel,
      });

      if (res.data.success) {
        router.push('/agents');
      } else {
        setError('Failed to create AI agent.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error submitting agent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-slate-400 hover:text-white border border-[#232733] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" /> Register New AI Agent
          </h2>
          <p className="text-xs text-slate-300">Define agent capabilities, type, and baseline risk level (Member 1 — Semester 5).</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] space-y-5 shadow-xl">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Code Security Vulnerability Scanner"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Agent Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the agent's purpose, operational scope, and execution capabilities..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Agent Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white font-medium"
            >
              <option value="RESEARCH">RESEARCH</option>
              <option value="EMAIL">EMAIL</option>
              <option value="DATABASE">DATABASE</option>
              <option value="CODING">CODING</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Baseline Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white font-medium"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#232733]">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-xs font-semibold text-slate-300 border border-[#232733] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Registering...' : 'Register Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
