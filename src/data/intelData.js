export const intelFeed = [
  {
    cve: 'CVE-2025-21442',
    name: 'OpenSSH Pre-Auth Memory Leak / Buffer Overflow',
    severity: '9.8 CRITICAL',
    type: 'Remote Code Execution',
    affected: 'OpenSSH 8.5p1 - 9.7p1',
    status: 'Patch Deployed',
    updated: '2026-09-24T18:30:00Z',
    signature: 'SIG-SSH-09941'
  },
  {
    cve: 'CVE-2025-18290',
    name: 'SCADA DNP3 Out-of-Band Master Parser Exception',
    severity: '8.6 HIGH',
    type: 'Industrial SCADA Hijack',
    affected: 'GridRelay-v4 Firmware <= 4.2.1',
    status: 'Mitigation Active (Airgap)',
    updated: '2026-09-24T14:15:00Z',
    signature: 'SIG-SCADA-4412'
  },
  {
    cve: 'CVE-2025-09144',
    name: 'Linux Kernel eBPF Map Lookup Race Condition',
    severity: '7.8 HIGH',
    type: 'Local Privilege Escalation',
    affected: 'Linux Kernel 6.1.x - 6.8.x',
    status: 'Kernel Module Hardened',
    updated: '2026-09-23T22:00:00Z',
    signature: 'SIG-KRNL-8820'
  },
  {
    cve: 'CVE-2025-01029',
    name: 'BGP Route Hijacking via Malformed AS_PATH Attributes',
    severity: '8.1 HIGH',
    type: 'Autonomous Routing Attack',
    affected: 'BGP Core Routers',
    status: 'ROA Validation Enforced',
    updated: '2026-09-23T11:45:00Z',
    signature: 'SIG-BGP-1102'
  }
];

export const threatActors = [
  {
    tag: 'APT-41 (BRONZE ATLAS)',
    origin: 'East Asia',
    targetSectors: 'Critical Infrastructure, Telecom, Defense Supply',
    tactics: 'Homoglyph Phishing, Cobalt Strike Beacons, SCADA DNP3 Exploits',
    threatLevel: 'TIER 1 SEVERE',
    activeIncidents: 4
  },
  {
    tag: 'SANDWORM / VOODOO BEAR',
    origin: 'Eastern Europe',
    targetSectors: 'Energy Grid, Substation SCADA, National Backbones',
    tactics: 'Industroyer2, BlackEnergy3, Zero-Day Firmware Flashing',
    threatLevel: 'TIER 1 SEVERE',
    activeIncidents: 7
  },
  {
    tag: 'LAPSUS$ // SHADOW RESIDUE',
    origin: 'Decentralized',
    targetSectors: 'Cloud Identity Providers, Okta SSO, OAuth Tokens',
    tactics: 'MFA Fatigue, Session Cookie Hijacking, Telegram C2',
    threatLevel: 'TIER 2 ELEVATED',
    activeIncidents: 2
  }
];

export const reportsList = [
  {
    id: 'REP-2026-09-001',
    title: 'SENTINAL SOC National Threat Landscape & Critical Grid Audit',
    classification: 'CONFIDENTIAL // OFFICIAL USE ONLY',
    date: 'September 24, 2026',
    author: 'Chief Intelligence Analyst #4092',
    pages: 18,
    fileSize: '3.4 MB',
    summary: 'Comprehensive analysis of 247 detected ingress vectors, SCADA defense posture, and zero-day containment rates.'
  },
  {
    id: 'REP-2026-09-002',
    title: 'AI Agent Autonomous Runtime Interception & eBPF Sandboxing Report',
    classification: 'RESTRICTED // SOC-DEV',
    date: 'September 23, 2026',
    author: 'Autonomous Defense Sub-Engine',
    pages: 8,
    fileSize: '1.8 MB',
    summary: 'Detailed performance audit of Claude Code, Devin, and Aider sessions with file system vault rollback benchmarks.'
  },
  {
    id: 'REP-2026-08-019',
    title: 'CERT-In Incident Advisory: AS4819 BGP Routing Anomaly & SCADA Telemetry Defense',
    classification: 'OFFICIAL ADVISORY',
    date: 'September 15, 2026',
    author: 'National Cyber Coordination Centre',
    pages: 12,
    fileSize: '2.1 MB',
    summary: 'Technical post-mortem on multi-hop spoofing mitigations across 4 regional clusters.'
  }
];
