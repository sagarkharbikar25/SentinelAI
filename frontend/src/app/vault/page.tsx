'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  HardDrive,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useDaemon } from '@/context/DaemonContext';
import OfflineBanner from '@/components/ui/OfflineBanner';

interface VaultFile {
  id: string;
  originalPath: string;
  sizeBytes: number;
  hash: string;
  backupTime: string;
  versionsCount: number;
}

const mockVaultFiles: VaultFile[] = [
  {
    id: 'vf-1',
    originalPath: 'd:/GitHub/SentinelAI/daemon/sentinel/api/routes.py',
    sizeBytes: 14200,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    backupTime: 'Just now',
    versionsCount: 3,
  },
  {
    id: 'vf-2',
    originalPath: 'd:/GitHub/SentinelAI/.env',
    sizeBytes: 420,
    hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    backupTime: '5 mins ago',
    versionsCount: 1,
  },
  {
    id: 'vf-3',
    originalPath: 'd:/GitHub/SentinelAI/daemon/sentinel/core/decision_engine.py',
    sizeBytes: 6800,
    hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    backupTime: '12 mins ago',
    versionsCount: 2,
  },
];

// F9: Proper pluralization with Intl.PluralRules
const pluralRules = new Intl.PluralRules('en-US');
function formatVersionsCount(count: number): string {
  const rule = pluralRules.select(count);
  return rule === 'one' ? `${count} version` : `${count} versions`;
}

export default function VaultPage() {
  const { status, vaultSizeMb } = useDaemon();
  const isOnline = status === 'online';

  const [searchTerm, setSearchTerm] = useState('');
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<VaultFile | null>(null);

  const filteredFiles = mockVaultFiles.filter((f) =>
    f.originalPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestoreCopy = (filePath: string) => {
    if (!isOnline) return;
    const msg = `Restored as copy: ${filePath}.restore.bak`;
    setRestoreMessage(msg);
    setTimeout(() => setRestoreMessage(null), 4000);
  };

  const handleConfirmOriginalRestore = () => {
    if (!confirmRestoreFile || !isOnline) return;
    const msg = `Restored to original path: ${confirmRestoreFile.originalPath}`;
    setRestoreMessage(msg);
    setConfirmRestoreFile(null);
    setTimeout(() => setRestoreMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <OfflineBanner />

      {/* Header (F1: White Headings) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isOnline ? 'bg-accent-emerald animate-pulse' : 'bg-accent-rose'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-accent-emerald' : 'text-accent-rose'
              }`}
            >
              Content-addressed &bull; Deduplicated blob store
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight text-balance">
            Backup Vault Explorer
          </h1>
          <p className="text-xs text-text-secondary text-pretty max-w-2xl">
            Pre-mutation file snapshots stored deterministically by SHA-256 hash. Safe multi-version rollbacks for intercepted agent operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-mono shadow-xs flex items-center gap-2 text-text-secondary">
            <HardDrive className="size-3.5 text-accent" />
            <span>Vault storage: <strong className="text-text-primary tabular-nums">{vaultSizeMb > 0 ? `${vaultSizeMb.toFixed(1)} MB` : '21.4 KB'}</strong></span>
          </div>
        </div>
      </div>

      {restoreMessage && (
        <div className="p-4 rounded-2xl bg-card border border-accent-emerald/40 text-accent-emerald text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-accent-emerald" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="size-3.5 text-text-muted absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter vaulted files by path or hash..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-text-primary font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all shadow-xs"
        />
      </div>

      {/* Vaulted Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-border-hover transition-colors space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-surface text-accent">
                  <FileCode className="size-4" />
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-surface text-text-secondary border border-border font-semibold">
                  {formatVersionsCount(file.versionsCount)}
                </span>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-text-primary truncate" title={file.originalPath}>
                  {file.originalPath.split('/').pop()}
                </p>
                <p className="text-[10px] font-mono text-text-muted truncate" title={file.originalPath}>
                  {file.originalPath}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-border space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-text-muted">
                  <span>Size:</span>
                  <span className="text-text-primary font-medium tabular-nums">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Snapshot:</span>
                  <span className="text-text-primary font-medium">{file.backupTime}</span>
                </div>
                <div className="text-[9px] text-text-muted truncate pt-1 border-t border-border">
                  SHA-256: {file.hash.slice(0, 20)}...
                </div>
              </div>
            </div>

            {/* Restore Action Buttons (F11: Safe labels, distinct icons, destructive confirmation) */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleRestoreCopy(file.originalPath)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to restore.' : 'Restore snapshot to side-path copy without altering current file'}
                className="flex-1 py-2 rounded-xl bg-surface hover:bg-card-hover border border-border text-[11px] font-mono font-medium text-text-primary transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="size-3 text-text-muted" />
                <span>Restore as copy</span>
              </button>

              <button
                onClick={() => setConfirmRestoreFile(file)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to restore.' : 'Restore snapshot directly to original path (overwrites target)'}
                className="flex-1 py-2 rounded-xl bg-accent-rose/15 hover:bg-accent-rose/25 border border-accent-rose/40 text-accent-rose text-[11px] font-mono font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="size-3 text-accent-rose" />
                <span>Restore to original</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog for Destructive Overwrite Restore (F11) */}
      {confirmRestoreFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-restore-title"
            className="w-full max-w-md rounded-2xl bg-card border border-accent-rose/50 shadow-2xl p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span className="p-2 rounded-xl bg-accent-rose/15 text-accent-rose">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h3 id="confirm-restore-title" className="font-heading font-bold text-sm text-text-primary">
                  Confirm Overwrite Restore
                </h3>
                <p className="text-[11px] text-text-muted">
                  Destructive rollback action
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border space-y-2 text-[11px]">
              <div>
                <span className="text-text-muted block">Target Path:</span>
                <span className="text-text-primary font-bold break-all">{confirmRestoreFile.originalPath}</span>
              </div>
              <div>
                <span className="text-text-muted block">Vaulted Blob SHA-256:</span>
                <span className="text-accent break-all">{confirmRestoreFile.hash}</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to restore to the original path? Any uncommitted changes in the current file will be overwritten with the snapshot.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setConfirmRestoreFile(null)}
                className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-card-hover border border-border text-text-primary font-medium transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOriginalRestore}
                className="flex-1 py-2.5 rounded-xl bg-accent-rose hover:opacity-90 text-white font-bold transition-opacity text-xs"
              >
                Confirm Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
