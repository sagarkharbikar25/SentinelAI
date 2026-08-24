import Link from 'next/link';
import { Wrench, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-purple-950/30 to-[#13151C] border border-blue-500/30 shadow-xl">
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
          Welcome to SentinelAI Security Platform
        </h2>
        <p className="text-sm text-slate-200 leading-relaxed max-w-2xl font-medium">
          Real-time security governance, threat prevention, and access policies for enterprise AI agents. Fully connected to NestJS Backend & Supabase Database.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#13151C] border border-[#232733] space-y-1.5 shadow-md">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Active System Tools</p>
          <p className="text-2xl font-extrabold text-blue-400">5 Registered</p>
          <p className="text-[11px] text-slate-400 font-mono">WEB_SEARCH, EXECUTE_SQL, etc.</p>
        </div>

        <div className="p-5 rounded-xl bg-[#13151C] border border-[#232733] space-y-1.5 shadow-md">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Active Security Policies</p>
          <p className="text-2xl font-extrabold text-emerald-400">1 Policy (2 Rules)</p>
          <p className="text-[11px] text-slate-400 font-mono">DENY SQL, REQUIRE_CONFIRMATION</p>
        </div>

        <div className="p-5 rounded-xl bg-[#13151C] border border-[#232733] space-y-1.5 shadow-md">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Sample AI Agents</p>
          <p className="text-2xl font-extrabold text-purple-400">4 Active</p>
          <p className="text-[11px] text-slate-400 font-mono">Research, Email, DB Analytics, Coding</p>
        </div>

        <div className="p-5 rounded-xl bg-[#13151C] border border-[#232733] space-y-1.5 shadow-md">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Database Persistence</p>
          <p className="text-2xl font-extrabold text-amber-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Supabase
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Live Cloud PostgreSQL</p>
        </div>
      </div>

      {/* Member 2 Navigation Cards */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold text-white tracking-wide">Member 2 Security Pages (Semester 5)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/policies"
            className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] hover:border-blue-500/50 hover:bg-[#1A1D27] transition-all duration-300 group space-y-3 shadow-lg glow-blue"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition">Security Policies</h4>
                  <p className="text-xs text-slate-300">Active DENY & REQUIRE_CONFIRMATION rules</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Manage governance security policies, active DENY/ALLOW rules, target agent types, and policy execution gates.
            </p>
          </Link>

          <Link
            href="/tools"
            className="p-6 rounded-2xl bg-[#13151C] border border-[#232733] hover:border-purple-500/50 hover:bg-[#1A1D27] transition-all duration-300 group space-y-3 shadow-lg glow-purple"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Wrench className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-purple-400 transition">Tools Registry</h4>
                  <p className="text-xs text-slate-300">Registered agent tools & permission gates</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Inspect registered agent execution tools, risk levels (LOW, MEDIUM, HIGH), and required permissions.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
