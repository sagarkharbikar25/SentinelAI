export const initialStats = {
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
  blockedContainmentRate: 99.2
};

export const sampleScanTargets = {
  url: 'https://security-payload-verification.internal-scada.org/auth/token?sig=4bf02',
  email: 'urgent-account-validation@internal-sec-audit.portal-gateway.net',
  file: 'mimikatz_x64_obfuscated_stage2.bin',
  ip: '198.51.100.24 (AS40201 - Malicious Proxy / BGP Anomaly)',
  text: 'POST /v2/internal/credentials/dump HTTP/1.1\nHost: admin.scada.gov\nAuthorization: Bearer null\nX-Exploit-Payload: \x7f\x45\x4c\x46\x02\x01\x01'
};

export const defaultThreatResult = {
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
    { label: 'Redirects:', value: '3 Redirects', status: 'tertiary' }
  ],
  verdict: 'Target URL demonstrates structural attributes aligned with adversarial spear-phishing campaigns. Features low-reputation ASN upstreaming, newly generated Let\'s Encrypt certificates, multi-hop canonical obfuscation, and heuristic mimicry of enterprise single sign-on endpoints.',
  sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
};

export const initialIncidents = [
  {
    id: 'THR-2048',
    type: 'Phishing',
    sourceType: 'URL',
    sourceDetail: 'https://auth-renew.org',
    riskScore: 92,
    severity: 'CRITICAL',
    status: 'Active',
    time: '2 min ago',
    details: 'Homoglyph domain mimicking banking SSO endpoint. Rapid ingress detected across 14 workstations.'
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
    details: 'Polymorphic shellcode execution attempt intercepted in staging sandbox environment.'
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
    details: 'Repeated unauthorized port scanning targeting internal SCADA protocol telemetry port 502.'
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
    details: 'Automated brute force attempt distributed across 320 residential proxy exit nodes. IP block applied.'
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
    details: 'Memory corruption exploit payload intercepted by eBPF kernel inspection hook prior to execution.'
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
    details: 'Beaconing frequency 30s detected from endpoint HR-PC-04. Airgap isolation protocol executed.'
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
    details: 'Attempt to execute setuid binary with manipulated environment variable strings.'
  }
];
