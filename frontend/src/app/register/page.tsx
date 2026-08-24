'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError('Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto shadow-lg shadow-blue-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Create SentinelAI Account</h2>
          <p className="text-xs text-slate-400 font-medium">Join the Enterprise AI Agent Security Platform</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                placeholder="Security Engineer"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                placeholder="dev@sentinelai.io"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0B0C10] border border-[#232733] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
