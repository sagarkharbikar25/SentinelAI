'use client';

import React, { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import { Users as UsersIcon, Shield, CheckCircle2, RefreshCw, AlertTriangle, Lock } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        setError('Failed to load system users.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to NestJS API (Port 3001).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'DEVELOPER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ANALYST':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'VIEWER':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-wide">
            <UsersIcon className="w-6 h-6 text-purple-400" /> User Role & Access Management
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            System users, role-based access control (RBAC), and user status management (Member 1 — Semester 5).
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13151C] hover:bg-[#1D212B] text-xs font-semibold text-slate-200 border border-[#232733] transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-300 text-sm animate-pulse font-medium">
          Loading system users from NestJS Backend (Port 3001)...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#232733] bg-[#13151C] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0C10] border-b border-[#232733] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">User Details</th>
                <th className="px-6 py-3.5">System Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232733]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#1D212B] transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-sm">{user.name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
