'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radar,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Search,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Terminal,
  Shield,
  FileText,
  Lock,
} from 'lucide-react';
import { getDaemonStatus, getRecentActions, DaemonStatus, ActionLog } from '@/lib/daemon';

// Member 1 Canonical Data
const initialStats = {
  totalThreats: 247,
  totalThreatsDelta: '+14 in past hour',
  totalThreatsCapacity: 68,
  critical: 18,
  criticalIsolated: 9,
  criticalCapacity: 84,
  highRisk: 43,
  highRiskPipeline: 'Pipeline active',
  highRiskCapacity: 48,
  blocked: 186,
  blockedContainmentRate: 99.2,
};

const sampleScanTargets: Record<string, string> = {
  url: 'https://security-payload-verification.internal-scada.org/auth/token?sig=4bf02',
  email: 'urgent-account-validation@internal-sec-audit.portal-gateway.net',
  file: 'mimikatz_x64_obfuscated_stage2.bin',
  ip: '198.51.100.24 (AS40201 - Malicious Proxy / BGP Anomaly)',
  text: 'POST /v2/internal/credentials/dump HTTP/1.1\nHost: admin.scada.gov\nAuthorization: Bearer null\nX-Exploit-Payload: \\x7f\\x45\\x4c\\x46\\x02\\x01\\x01',
};

const defaultThreatResult = {
  id: 'INC-89312',
  score: 87,
  riskLevel: 'HIGH RISK',
  classification: 'PHISHING',
  subVector: 'Credential Trap',
  confidence: '94.8%',
  consensus: 'Ensemble consensus',
  heuristicMatch: 'HOMOGLYPH_CLONE_v2',
  indicators: [
    { label: 'Domain Rep:', value: 'Suspicious', status: 'tertiary' },
    { label: 'IP Rep:', value: 'Malicious', status: 'error' },
    { label: 'SSL Cert:', value: 'Valid (LE)', status: 'primary' },
    { label: 'Domain Age:', value: '12 Days', status: 'primary' },
    { label: 'Blacklists:', value: 'Detected (6/84)', status: 'error' },
    { label: 'Redirects:', value: '3 Redirects', status: 'tertiary' },
  ],
  verdict:
    "Target URL demonstrates structural attributes aligned with adversarial spear-phishing campaigns. Features low-reputation ASN upstreaming, newly generated Let's Encrypt certificates, multi-hop canonical obfuscation, and heuristic mimicry of enterprise single sign-on endpoints.",
  sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
};

const initialIncidents = [
  {
    id: 'THR-2048',
    type: 'Phishing',
    sourceType: 'URL',
    sourceDetail: 'https://auth-renew.org',
    riskScore: 92,
    severity: 'CRITICAL',
    status: 'Active',
    time: '2 min ago',
    details: 'Homoglyph domain mimicking banking SSO endpoint. Rapid ingress detected across 14 workstations.',
  },
  {
    id: 'THR-2047',
    type: 'Malware',
    sourceType: 'File (.exe)',
    sourceDetail: 'payload_x64.dll',
    riskScore: 87,
    severity: 'HIGH',
    status: 'Investigating',
    time: '8 min ago',
    details: 'Polymorphic shellcode execution attempt intercepted in staging sandbox environment.',
  },
  {
    id: 'THR-2046',
    type: 'Suspicious IP',
    sourceType: 'Network / BGP',
    sourceDetail: '45.154.255.89 [AS4819]',
    riskScore: 76,
    severity: 'HIGH',
    status: 'Investigating',
    time: '15 min ago',
    details: 'Repeated unauthorized port scanning targeting internal SCADA protocol telemetry port 502.',
  },
  {
    id: 'THR-2045',
    type: 'Credential Stuffing',
    sourceType: 'API Gateway',
    sourceDetail: '/api/v1/user/auth',
    riskScore: 64,
    severity: 'MEDIUM',
    status: 'Mitigated',
    time: '24 min ago',
    details: 'Automated brute force attempt distributed across 320 residential proxy exit nodes. IP block applied.',
  },
  {
    id: 'THR-2044',
    type: 'Zero-Day CVE-2025',
    sourceType: 'Ingress Proxy',
    sourceDetail: 'NGINX reverse proxy buffer overflow',
    riskScore: 98,
    severity: 'CRITICAL',
    status: 'Isolated',
    time: '41 min ago',
    details: 'Memory corruption exploit payload intercepted by eBPF kernel inspection hook prior to execution.',
  },
  {
    id: 'THR-2043',
    type: 'Ransomware Beacon',
    sourceType: 'DNS / C2',
    sourceDetail: 'ns1.darkmatter-sync.top',
    riskScore: 91,
    severity: 'CRITICAL',
    status: 'Blocked',
    time: '1 hour ago',
    details: 'Beaconing frequency 30s detected from endpoint HR-PC-04. Airgap isolation protocol executed.',
  },
  {
    id: 'THR-2042',
    type: 'Privilege Escalation',
    sourceType: 'Local Daemon',
    sourceDetail: 'sudoers modification probe',
    riskScore: 79,
    severity: 'HIGH',
    status: 'Mitigated',
    time: '2 hours ago',
    details: 'Attempt to execute setuid binary with manipulated environment variable strings.',
  },
];

export default function DashboardPage() {
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [daemonActions, setDaemonActions] = useState<ActionLog[]>([]);
  const [scanMode, setScanMode] = useState<string>('url');
  const [scanInput, setScanInput] = useState<string>(sampleScanTargets.url);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [threatResult, setThreatResult] = useState(defaultThreatResult);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function syncDaemon() {
      try {
        const [status, actions] = await Promise.all([
          getDaemonStatus(),
          getRecentActions(6),
        ]);
        setDaemonStatus(status);
        setDaemonActions(actions);
      } catch (e) {
        // Daemon offline gracefully handled
      }
    }
    syncDaemon();
    const interval = setInterval(syncDaemon, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode: string) => {
    setScanMode(mode);
    setScanInput(sampleScanTargets[mode] || '');
  };

  const handleRunAnalysis = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setThreatResult({
        ...defaultThreatResult,
        id: `INC-${Math.floor(10000 + Math.random() * 90000)}`,
        score: Math.floor(75 + Math.random() * 23),
      });
    }, 600);
  };

  const filteredIncidents = initialIncidents.filter((item) => {
    const matchSev = filterSeverity === 'ALL' || item.severity === filterSeverity;
    const matchSearch =
      searchTerm === '' ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sourceDetail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Member 1 Tactical Hero Overview */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#3F4850]/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#93CCFF] uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-[#93CCFF] animate-pulse" />
            <span className="font-bold">SYSTEM ACTIVE // MIL-SPEC TELEMETRY INGRESS</span>
            <span className="text-[#89929B]">::</span>
            <span className="text-[#BFC7D2]">GRID-ALPHA-9 [NOC DELHI]</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CYBER SECURITY OVERVIEW
          </h1>
          <p className="text-xs text-[#BFC7D2] flex flex-wrap items-center gap-2">
            <span>AI-powered continuous threat monitoring, dynamic heuristics &amp; defense orchestration.</span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#89929B]" />
            <span className="font-mono text-[#93CCFF] font-semibold text-[11px]">
              DAEMON PROTOCOL: {daemonStatus ? '127.0.0.1:8765 ACTIVE' : 'LOCAL ENGINE CONNECTED'} | SOC CLUSTER: PRIMARY-DELTA
            </span>
          </p>
        </div>

        {/* Telemetry Stats */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#181B25] border border-[#3F4850]/50 flex items-center gap-2.5 shadow-sm">
            <Activity className="w-4 h-4 text-[#93CCFF]" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#89929B] uppercase">PACKET INGEST</span>
              <span className="text-white font-bold text-xs">1.48 TB/s</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#181B25] border border-[#3F4850]/50 flex items-center gap-2.5 shadow-sm">
            <Activity className="w-4 h-4 text-[#FFB95F]" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#89929B] uppercase">NEURAL LATENCY</span>
              <span className="text-white font-bold text-xs">4.2ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Member 1 Tactical Metric Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1: Total Threats */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#3F4850]/50 flex flex-col justify-between hover:border-[#93CCFF]/60 transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#89929B] uppercase tracking-wider">TOTAL THREATS</span>
            <Radar className="w-4 h-4 text-[#93CCFF]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-white">{initialStats.totalThreats}</span>
            <span className="text-[11px] text-[#93CCFF] font-semibold">{initialStats.totalThreatsDelta}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#93CCFF]" style={{ width: `${initialStats.totalThreatsCapacity}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span>Target baseline</span>
            <span className="text-[#DFE2F0]">{initialStats.totalThreatsCapacity}% of capacity</span>
          </div>
        </div>

        {/* Card 2: Defcon 2 Critical */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#93000A]/60 flex flex-col justify-between hover:border-[#FFB4AB] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#FFB4AB] uppercase tracking-wider font-bold">DEFCON 2 CRITICAL</span>
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB4AB] animate-pulse" />
              IMMEDIATE
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#FFB4AB]">{initialStats.critical}</span>
            <span className="text-[11px] text-[#FFB4AB]">{initialStats.criticalIsolated} isolated</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#FFB4AB]" style={{ width: `${initialStats.criticalCapacity}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#FFB4AB]">Isolation required</span>
            <span className="text-[#DFE2F0]">Target: 0</span>
          </div>
        </div>

        {/* Card 3: High Risk */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#CA8100]/60 flex flex-col justify-between hover:border-[#FFB95F] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#FFB95F] uppercase tracking-wider font-bold">ELEVATED RISKS</span>
            <AlertTriangle className="w-4 h-4 text-[#FFB95F]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#FFB95F]">{initialStats.highRisk}</span>
            <span className="text-[11px] text-[#89929B]">{initialStats.highRiskPipeline}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#FFB95F]" style={{ width: `${initialStats.highRiskCapacity}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#FFB95F]">Triage active</span>
            <span className="text-[#DFE2F0]">{initialStats.highRiskCapacity}% threshold</span>
          </div>
        </div>

        {/* Card 4: Automated Containment */}
        <div className="p-4 rounded-xl bg-[#181B25] border border-[#00A572]/60 flex flex-col justify-between hover:border-[#4EDEA3] transition-all shadow-lg group">
          <div className="flex justify-between items-start pb-1">
            <span className="text-[10px] text-[#4EDEA3] uppercase tracking-wider font-bold">CONTAINED THREATS</span>
            <CheckCircle2 className="w-4 h-4 text-[#4EDEA3]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold text-[#4EDEA3]">{initialStats.blocked}</span>
            <span className="text-[11px] text-[#4EDEA3]">{initialStats.blockedContainmentRate}% rate</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1C1F29] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#4EDEA3]" style={{ width: `${initialStats.blockedContainmentRate}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[#89929B] mt-1.5">
            <span className="text-[#4EDEA3]">Deterministic block</span>
            <span className="text-[#DFE2F0]">Zero escape</span>
          </div>
        </div>
      </section>

      {/* 3. Member 1 Interactive Threat Detection Engine & Analysis Result */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scanner Module */}
        <div className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="px-4 py-2.5 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-[#93CCFF]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">THREAT DETECTION ENGINE</span>
            </div>
            <span className="text-[10px] font-bold text-[#93CCFF] px-2 py-0.5 rounded border border-[#93CCFF]/30 bg-[#93CCFF]/10">
              MOD: SCAN-AI-V4.8
            </span>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-[#BFC7D2]">
              Analyze suspicious digital content using AI-powered deep heuristic pattern extraction and sandboxed zero-day introspection.
            </p>

            {/* 5 Mode Tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[#0A0E17] border border-[#3F4850]/40 font-mono text-[10px]">
              {(['url', 'email', 'file', 'ip', 'text'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`py-1.5 rounded font-bold uppercase transition ${
                    scanMode === mode
                      ? 'bg-[#3198DC] text-[#002C47]'
                      : 'text-[#89929B] hover:text-white hover:bg-[#1C1F29]'
                  }`}
                >
                  {mode === 'ip' ? 'IP ADDR' : mode}
                </button>
              ))}
            </div>

            {/* Target Input */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[10px] text-[#89929B]">
                <span>ENTER TARGET {scanMode.toUpperCase()} FOR INSPECTION</span>
                <span className="text-[#93CCFF]">PROTOCOL: HTTPS/DIRECT</span>
              </div>
              <textarea
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                rows={3}
                className="w-full bg-[#0A0E17] border border-[#3F4850]/50 rounded-lg p-3 text-xs text-white focus:border-[#93CCFF] focus:outline-none resize-none font-mono"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isScanning}
              className="w-full py-2.5 rounded-lg bg-[#3198DC] hover:bg-[#93CCFF] text-[#002C47] font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'RUNNING DEEP HEURISTIC INSPECTION...' : 'EXECUTE AI THREAT SCAN'}
            </button>
          </div>
        </div>

        {/* Threat Analysis Result */}
        <div className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg flex flex-col justify-between font-mono">
          <div className="px-4 py-2.5 bg-[#0A0E17] border-b border-[#3F4850]/40 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">LATEST HEURISTIC ANALYSIS</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-[#FFB4AB] border border-[#FFB4AB]/30 font-bold">
              {threatResult.riskLevel}
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4850]/30 pb-3">
              <div>
                <span className="text-[10px] text-[#89929B]">CLASSIFICATION</span>
                <h4 className="text-lg font-extrabold text-white mt-0.5">{threatResult.classification} // {threatResult.subVector}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#89929B]">CONFIDENCE SCORE</span>
                <p className="text-2xl font-black text-[#FFB4AB]">{threatResult.score}/100</p>
              </div>
            </div>

            {/* Indicator Matrix */}
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {threatResult.indicators.map((ind) => (
                <div key={ind.label} className="p-2 rounded bg-[#0A0E17] border border-[#3F4850]/30">
                  <span className="text-[#89929B] block">{ind.label}</span>
                  <span className="text-white font-bold">{ind.value}</span>
                </div>
              ))}
            </div>

            {/* Verdict */}
            <p className="text-xs text-[#BFC7D2] leading-relaxed p-3 rounded-lg bg-[#0A0E17] border border-[#3F4850]/40 font-sans">
              {threatResult.verdict}
            </p>

            <div className="text-[10px] text-[#89929B] truncate">
              <span>SHA-256: </span>
              <span className="text-[#93CCFF]">{threatResult.sha256}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Member 1 Incident Audit Table */}
      <section className="rounded-xl bg-[#181B25] border border-[#3F4850]/50 overflow-hidden shadow-lg font-mono">
        <div className="p-4 bg-[#0A0E17] border-b border-[#3F4850]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#93CCFF]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              REAL-TIME SOC INCIDENT AUDIT FEED ({filteredIncidents.length})
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#89929B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search incident, IP, hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#181B25] border border-[#3F4850]/50 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:border-[#93CCFF] focus:outline-none"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-[10px]">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-1 rounded font-bold transition ${
                    filterSeverity === sev
                      ? 'bg-[#3198DC] text-[#002C47]'
                      : 'text-[#89929B] hover:text-white bg-[#181B25]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#89929B] uppercase text-[10px] border-b border-[#3F4850]/30 bg-[#181B25]/60">
              <tr>
                <th className="py-2.5 px-4">INCIDENT ID</th>
                <th>TYPE</th>
                <th>VECTOR / SOURCE</th>
                <th>SEVERITY</th>
                <th>RISK</th>
                <th>STATUS</th>
                <th>DETECTED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3F4850]/20">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[#1C1F29]/60 transition">
                  <td className="py-3 px-4 font-bold text-[#93CCFF]">{inc.id}</td>
                  <td className="text-white font-semibold">{inc.type}</td>
                  <td className="text-[#BFC7D2] font-mono text-[11px]">{inc.sourceDetail}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-[#FFB4AB] border-[#FFB4AB]/30'
                          : inc.severity === 'HIGH'
                          ? 'bg-amber-500/15 text-[#FFB95F] border-[#FFB95F]/30'
                          : 'bg-emerald-500/15 text-[#4EDEA3] border-[#4EDEA3]/30'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="font-bold text-white">{inc.riskScore}</td>
                  <td>
                    <span
                      className={`font-semibold text-[11px] ${
                        inc.status === 'Active'
                          ? 'text-[#FFB4AB]'
                          : inc.status === 'Investigating'
                          ? 'text-[#FFB95F]'
                          : 'text-[#4EDEA3]'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="text-[#89929B] text-[11px]">{inc.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
