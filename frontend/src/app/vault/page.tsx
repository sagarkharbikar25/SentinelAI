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

// Proper pluralization with Intl.PluralRules
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-pill ${
                isOnline ? 'bg-safe animate-pulse' : 'bg-critical'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isOnline ? 'text-safe-ink' : 'text-critical-ink'
              }`}
            >
              Content-addressed &bull; Deduplicated blob store
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-ink-1 tracking-tight text-balance">
            Backup Vault Explorer
          </h1>
          <p className="text-xs text-ink-2 text-pretty max-w-2xl">
            Pre-mutation file snapshots stored deterministically by SHA-256 hash. Safe multi-version rollbacks for intercepted agent operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-pill bg-well text-xs font-mono flex items-center gap-2 text-ink-2">
            <HardDrive className="size-3.5 text-brand" />
            <span>Vault storage: <strong className="text-ink-1 tabular-nums">{vaultSizeMb > 0 ? `${vaultSizeMb.toFixed(1)} MB` : '21.4 KB'}</strong></span>
          </div>
        </div>
      </div>

      {restoreMessage && (
        <div className="p-4 rounded-well bg-safe-soft text-safe-ink text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-safe-ink" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* Search Input (Pill radius, 1px line border) */}
      <div className="relative max-w-md">
        <Search className="size-3.5 text-ink-3 absolute left-4 top-3" />
        <input
          type="text"
          placeholder="Filter vaulted files by path or hash..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-well border border-line rounded-pill pl-10 pr-4 py-2 text-xs text-ink-1 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all shadow-xs"
        />
      </div>

      {/* Vaulted Files Grid (20px card radius, no card border, shadow-card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="p-5 rounded-card bg-surface shadow-card space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-well bg-well text-brand">
                  <FileCode className="size-4" />
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-pill bg-brand-soft text-brand-ink font-semibold">
                  {formatVersionsCount(file.versionsCount)}
                </span>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-ink-1 truncate" title={file.originalPath}>
                  {file.originalPath.split('/').pop()}
                </p>
                <p className="text-[10px] font-mono text-ink-3 truncate" title={file.originalPath}>
                  {file.originalPath}
                </p>
              </div>

              {/* File details inside Well */}
              <div className="p-3 rounded-well bg-well space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-ink-3">
                  <span>Size:</span>
                  <span className="text-ink-1 font-medium tabular-nums">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between text-ink-3">
                  <span>Snapshot:</span>
                  <span className="text-ink-1 font-medium">{file.backupTime}</span>
                </div>
                <div className="text-[9px] text-ink-3 truncate pt-1 border-t border-line">
                  SHA-256: {file.hash.slice(0, 20)}...
                </div>
              </div>
            </div>

            {/* Restore Action Buttons (Pill radius) */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleRestoreCopy(file.originalPath)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to restore.' : 'Restore snapshot to side-path copy without altering current file'}
                className="flex-1 py-2 rounded-pill bg-well hover:bg-well/80 text-[11px] font-mono font-medium text-ink-1 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="size-3 text-ink-3" />
                <span>Restore as copy</span>
              </button>

              <button
                onClick={() => setConfirmRestoreFile(file)}
                disabled={!isOnline}
                title={!isOnline ? 'Daemon offline. Start local service on port 8765 to restore.' : 'Restore snapshot directly to original path (overwrites target)'}
                className="flex-1 py-2 rounded-pill bg-critical-soft hover:bg-critical/20 text-critical-ink text-[11px] font-mono font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="size-3 text-critical-ink" />
                <span>Restore to original</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog for Destructive Overwrite Restore */}
      {confirmRestoreFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-restore-title"
            className="w-full max-w-md rounded-card bg-surface shadow-card border border-line p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="p-2 rounded-pill bg-critical-soft text-critical-ink">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h3 id="confirm-restore-title" className="font-display font-bold text-base text-ink-1">
                  Confirm Overwrite Restore
                </h3>
                <p className="text-[11px] text-ink-3">
                  Destructive rollback action
                </p>
              </div>
            </div>

            <div className="p-3 rounded-well bg-well space-y-2 text-[11px]">
              <div>
                <span className="text-ink-3 block">Target Path:</span>
                <span className="text-ink-1 font-bold break-all">{confirmRestoreFile.originalPath}</span>
              </div>
              <div>
                <span className="text-ink-3 block">Vaulted Blob SHA-256:</span>
                <span className="text-brand-ink break-all">{confirmRestoreFile.hash}</span>
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              Are you sure you want to restore to the original path? Any uncommitted changes in the current file will be overwritten with the snapshot.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setConfirmRestoreFile(null)}
                className="flex-1 py-2.5 rounded-pill bg-well hover:bg-well/80 text-ink-1 font-medium transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOriginalRestore}
                className="flex-1 py-2.5 rounded-pill bg-critical-soft text-critical-ink hover:bg-critical/20 font-bold transition-colors text-xs"
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
