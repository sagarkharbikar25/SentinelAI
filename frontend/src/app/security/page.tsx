"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Lock,
} from "lucide-react";

type Decision = "ALLOW" | "WARN" | "BLOCK";

export default function SecurityCenterPage() {
  const [decision, setDecision] = useState<Decision>("ALLOW");
  const [checked, setChecked] = useState(false);

  const runSecurityCheck = () => {
    setChecked(true);

    const decisions: Decision[] = ["ALLOW", "WARN", "BLOCK"];
    const randomDecision =
      decisions[Math.floor(Math.random() * decisions.length)];

    setDecision(randomDecision);
  };

  const riskScore =
    decision === "ALLOW" ? 18 : decision === "WARN" ? 56 : 91;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-400" />
              Security Threat Center
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Monitor threats, risk levels, and security decisions in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">
              Security Active
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#16181D] border border-[#262933]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Current Risk Score</span>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">
              {riskScore}
            </span>
            <span className="text-xs text-gray-500 mb-1">/ 100</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#16181D] border border-[#262933]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Security Decision</span>
            <ShieldAlert className="w-5 h-5 text-yellow-400" />
          </div>

          <div className="mt-3">
            <span
              className={`text-2xl font-bold ${
                decision === "ALLOW"
                  ? "text-green-400"
                  : decision === "WARN"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {decision}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {checked
              ? "Latest security check completed."
              : "Waiting for security check."}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#16181D] border border-[#262933]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Threat Monitoring</span>
            <Lock className="w-5 h-5 text-blue-400" />
          </div>

          <div className="mt-3 text-2xl font-bold text-white">
            LIVE
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Prompt security monitoring enabled.
          </p>
        </div>
      </div>

      {/* Security Check */}
      <div className="p-6 rounded-xl bg-[#16181D] border border-[#262933]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Security Decision Engine
            </h3>

            <p className="text-xs text-gray-400">
              Run a frontend security check and visualize the decision.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {decision === "ALLOW" && (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            )}

            {decision === "WARN" && (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}

            {decision === "BLOCK" && (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            )}

            <div>
              <p className="text-sm text-white font-medium">
                Current decision: {decision}
              </p>

              <p className="text-xs text-gray-500">
                Risk score: {riskScore}/100
              </p>
            </div>
          </div>

          <button
            onClick={runSecurityCheck}
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
          >
            Run Security Check
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-xl bg-[#16181D] border border-[#262933]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">
              Recent Security Activity
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Latest events detected by the security layer.
            </p>
          </div>

          <span className="text-xs text-purple-400">
            View all
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1B1D23]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-sm text-gray-200">
                  Safe request allowed
                </p>
                <p className="text-xs text-gray-500">
                  Prompt validation completed
                </p>
              </div>
            </div>

            <span className="text-xs text-green-400">ALLOW</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1B1D23]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-200">
                  Suspicious pattern detected
                </p>
                <p className="text-xs text-gray-500">
                  Request requires review
                </p>
              </div>
            </div>

            <span className="text-xs text-yellow-400">WARN</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1B1D23]">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-sm text-gray-200">
                  High-risk request blocked
                </p>
                <p className="text-xs text-gray-500">
                  Security policy triggered
                </p>
              </div>
            </div>

            <span className="text-xs text-red-400">BLOCK</span>
          </div>
        </div>
      </div>
    </div>
  );
}