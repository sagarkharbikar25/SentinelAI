export const agentStats = {
  activeSession: 'Claude Code',
  task: 'Fix authentication bug',
  pid: 84920,
  elapsed: '24:18 elapsed',
  hook: 'eBPF Active',
  buffer: '0.14ms',
  actionsToday: 247,
  allowedPercent: 92.7,
  blockedPercent: 7.3,
  blockedActions: 18,
  autoBlocked: 14,
  manualKill: 4,
  vaultFilesCount: 12,
  vaultSizeMB: '18.4 MB'
};

export const currentInterception = {
  id: '84920-A',
  agent: 'Claude Code',
  pid: 84920,
  action: 'DELETE',
  actionDesc: 'Unlink inode from working tree',
  target: '~/project/src/main.py',
  riskScore: 47,
  riskCategory: 'MEDIUM',
  riskReasons: [
    { type: 'error', icon: 'close', text: 'File is untracked by Git.' },
    { type: 'primary', icon: 'schedule', text: 'File was edited 12 minutes ago by agent session.' },
    { type: 'secondary', icon: 'commit', text: 'File has not been committed to any local branch or stash.' }
  ],
  fileMetadata: {
    size: '8.4 KB',
    git: 'Untracked',
    lastModified: '12m ago',
    scope: 'In Scope (~/projects/app)'
  },
  vaultBackup: {
    lines: 247,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'READY'
  },
  intent: '“Claude Code is requesting permission to delete a file that was recently modified and has not been committed.”',
  ruleTrigger: 'RUL-8821 (Destructive File Operations)'
};

export const activityFeed = [
  {
    id: 'ACT-101',
    time: '2:34 PM',
    status: 'ALLOW',
    agent: 'Claude Code',
    riskLevel: 'LOW — 18/100',
    riskColor: 'tertiary',
    actionText: 'modified',
    targetFile: 'src/auth.py',
    hasVault: true,
    fileSize: '4.8 KB'
  },
  {
    id: 'ACT-102',
    time: '2:31 PM',
    status: 'BLOCK',
    agent: 'Claude Code',
    riskLevel: 'HIGH — 82/100',
    riskColor: 'error',
    actionText: 'attempted to delete',
    targetFile: 'src/test.py',
    reason: 'Untracked file in protected directory',
    hasVault: false
  },
  {
    id: 'ACT-103',
    time: '2:27 PM',
    status: 'ALLOW',
    agent: 'Claude Code',
    riskLevel: 'LOW — 12/100',
    riskColor: 'tertiary',
    actionText: 'created',
    targetFile: 'src/login.tsx',
    hasVault: false,
    fileSize: '2.1 KB'
  },
  {
    id: 'ACT-104',
    time: '2:15 PM',
    status: 'ALLOW',
    agent: 'Claude Code',
    riskLevel: 'LOW — 22/100',
    riskColor: 'tertiary',
    actionText: 'executed command',
    targetFile: 'npm test -- --coverage',
    hasVault: false
  },
  {
    id: 'ACT-105',
    time: '1:58 PM',
    status: 'BLOCK',
    agent: 'Devin AI',
    riskLevel: 'HIGH — 91/100',
    riskColor: 'error',
    actionText: 'attempted to access secret key',
    targetFile: '.env.production',
    reason: 'Protected credential token file',
    hasVault: false
  }
];

export const vaultFiles = [
  {
    name: 'main.py',
    path: '~/project/src/',
    backupTime: '2:34 PM',
    retention: '6 days',
    size: '8.4 KB',
    hash: 'e3b0c442...',
    status: 'Protected'
  },
  {
    name: 'auth.py.bak',
    path: '~/project/src/',
    backupTime: '2:20 PM',
    retention: '6 days',
    size: '14.2 KB',
    hash: '7a9c1834...',
    status: 'Protected'
  },
  {
    name: 'database.ts',
    path: '~/project/config/',
    backupTime: '1:45 PM',
    retention: '7 days',
    size: '6.1 KB',
    hash: '5d82910f...',
    status: 'Protected'
  },
  {
    name: 'routes.py',
    path: '~/project/api/',
    backupTime: '12:10 PM',
    retention: '7 days',
    size: '18.9 KB',
    hash: '8f0012bc...',
    status: 'Protected'
  },
  {
    name: 'security.config.json',
    path: '~/project/',
    backupTime: '11:05 AM',
    retention: '7 days',
    size: '2.4 KB',
    hash: '1a44bc89...',
    status: 'Protected'
  }
];

export const agentRegistry = [
  {
    name: 'Claude Code',
    runtime: 'Local Node CLI',
    pid: 84920,
    hookState: 'eBPF Intercept Active',
    status: 'Online',
    permissions: 'Strict Interactive Mode',
    allowedActions: 184,
    blockedActions: 8
  },
  {
    name: 'Aider AI Assistant',
    runtime: 'Python Daemon',
    pid: 61042,
    hookState: 'Filesystem Watcher',
    status: 'Standby',
    permissions: 'Prompt on File Mutation',
    allowedActions: 42,
    blockedActions: 2
  },
  {
    name: 'Devin Cloud Runner',
    runtime: 'SSH Enclave Socket',
    pid: 92831,
    hookState: 'Network & FS Filter',
    status: 'Restricted',
    permissions: 'Sandbox Isolation Only',
    allowedActions: 21,
    blockedActions: 8
  }
];

export const securityPolicies = [
  {
    id: 'RUL-8821',
    name: 'Destructive File Operations (rm/unlink)',
    severity: 'High',
    action: 'Prompt User Approval',
    enabled: true,
    description: 'Intercepts any unlink or delete call targeting source directories'
  },
  {
    id: 'RUL-8822',
    name: 'Secret & Key Extraction Protection',
    severity: 'Critical',
    action: 'Auto-Block & Alert',
    enabled: true,
    description: 'Denies read/write to .env*, id_rsa*, pem keys, and token files'
  },
  {
    id: 'RUL-8823',
    name: 'Autonomous Git Force Push',
    severity: 'Critical',
    action: 'Auto-Block',
    enabled: true,
    description: 'Prevents non-interactive force push to main or production branches'
  },
  {
    id: 'RUL-8824',
    name: 'Network Egress to Untrusted CIDRs',
    severity: 'Medium',
    action: 'Deep Packet Inspection',
    enabled: true,
    description: 'Analyzes all outbound HTTP/WebSocket sockets created by agent sub-processes'
  }
];
