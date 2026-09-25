'use client';

import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Play,
  XCircle,
  FileCode,
} from 'lucide-react';
import { getTools, interceptAction, ToolItem } from '@/lib/daemon';

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { decision: string; risk: number; reason: string }>>({});

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTools();
      setTools(data);
    } catch (err: any) {
      setError(err.message || 'Daemon offline. Start the Python service on port 8765.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleTestTool = async (tool: ToolItem) => {
    setTestingTool(tool.name);
    try {
      const res = await interceptAction({
        agent_id: tool.owner || 'mcp-agent',
        agent_type: 'MCP',
        action_type: 'TOOL_INVOKE',
        operation: tool.name,
        target_path: `d:/GitHub/SentinelAI/workspace/${tool.name}`,
        command: `call_tool ${tool.name}`,
      });
      setTestResults((prev) => ({
        ...prev,
        [tool.name]: {
          decision: res.decision,
          risk: res.risk_score,
          reason: res.reason_code,
        },
      }));
    } catch (err: any) {
      console.error('Failed to test tool:', err);
    } finally {
      setTestingTool(null);
    }
  };

  const filteredTools = tools.filter(
    (t) =>
      searchTerm === '' ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3F4850]/50 pb-4">
        <div>
          <p className="portal-label text-[#93CCFF]">MANIFEST PERMISSION SURFACE // MCP RUNTIME BROKER</p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wide mt-1">
            <Wrench className="w-6 h-6 text-[#93CCFF]" /> System Tools &amp; Capability Registry
          </h2>
          <p className="text-xs text-[#BFC7D2] mt-1 font-medium">
            Authorized agent tools dynamically loaded from agent manifests in <code className="text-[#93CCFF]">manifests/*.toml</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTools}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#181B25] hover:bg-[#1E2330] text-xs font-mono font-semibold text-[#DFE2F0] border border-[#3F4850]/60 hover:border-[#93CCFF] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#93CCFF] ${loading ? 'animate-spin' : ''}`} /> REFRESH MANIFESTS
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-[#FFB4AB] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 shadow-lg flex items-center justify-between gap-4 font-mono">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#89929B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tools, owner agent, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141824] border border-[#3F4850]/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#93CCFF]"
          />
        </div>
        <span className="text-xs text-[#89929B]">
          {filteredTools.length} OF {tools.length} TOOLS LOADED
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#89929B] text-sm animate-pulse font-mono">
          Querying tool manifests from Sentinel daemon (Port 8765)...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const result = testResults[tool.name];
            const isTesting = testingTool === tool.name;

            return (
              <div
                key={tool.name}
                className="p-5 rounded-xl bg-[#0E131F] border border-[#3F4850]/50 hover:border-[#93CCFF]/50 transition duration-200 space-y-3 shadow-lg flex flex-col justify-between font-mono"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm tracking-wide break-all">
                      {tool.name}
                    </span>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                        tool.status === 'Verified'
                          ? 'bg-emerald-500/10 text-[#4EDEA3] border-[#4EDEA3]/30'
                          : 'bg-amber-500/10 text-[#FFB95F] border-[#FFB95F]/30'
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#89929B] mt-2 font-sans">
                    Owner: <span className="text-[#DFE2F0] font-mono font-semibold">{tool.owner}</span>
                  </p>

                  {result && (
                    <div
                      className={`mt-3 p-2.5 rounded border text-[11px] ${
                        result.decision === 'ALLOW'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>POLICY: {result.decision}</span>
                        <span>RISK: {result.risk}/100</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1 truncate">Reason: {result.reason}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#3F4850]/30 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#89929B]">
                    <Shield className="w-3.5 h-3.5 text-[#93CCFF]" /> Pre-hook Active
                  </span>

                  <button
                    onClick={() => handleTestTool(tool)}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded bg-[#181B25] hover:bg-[#1E2330] border border-[#3F4850]/50 hover:border-[#93CCFF] text-[#93CCFF] text-[10px] font-bold inline-flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                  >
                    <Play className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'TESTING...' : 'TEST AUTH'}
                  </button>
                </div>
              </div>
            );
          })}

          {!filteredTools.length && (
            <div className="col-span-full py-12 text-center text-[#89929B] font-mono space-y-2">
              <p className="text-sm font-semibold text-white">No Matching Tools Found</p>
              <p className="text-xs">
                Make sure tool TOML manifests exist in <code className="text-[#93CCFF]">manifests/</code> or check your search term.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
