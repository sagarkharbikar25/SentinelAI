'use client';

import React, { useState } from 'react';
import {
  Archive,
  RotateCcw,
  HardDrive,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';

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

export default function VaultPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const filteredFiles = mockVaultFiles.filter((f) =>
    f.originalPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = (filePath: string, sidePath: boolean) => {
    const msg = sidePath
      ? `Safely restored to side-path: ${filePath}.restore.bak`
      : `Restored original: ${filePath}`;
    setRestoreMessage(msg);
    setTimeout(() => setRestoreMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2EAE4] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-[#059669]">
              Content-addressed &bull; Deduplicated blob store
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#111915] tracking-tight text-balance">
            Backup Vault Explorer
          </h1>
          <p className="text-xs text-[#536459] text-pretty max-w-2xl">
            Pre-mutation file snapshots stored deterministically by SHA-256 hash. Zero data loss during rogue agent file overwrites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E2EAE4] text-xs font-mono shadow-xs flex items-center gap-2 text-[#536459]">
            <HardDrive className="size-3.5 text-[#059669]" />
            <span>Vault storage: <strong className="text-[#111915]">21.4 KB</strong></span>
          </div>
        </div>
      </div>

      {restoreMessage && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="size-3.5 text-[#75887B] absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter vaulted files by path or hash..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#FFFFFF] border border-[#E2EAE4] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111915] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-xs"
        />
      </div>

      {/* Vaulted Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2EAE4] shadow-xs hover:border-[#CBD8CF] transition-all space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-[#F4F7F5] text-[#059669]">
                  <FileCode className="size-4" />
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-semibold">
                  {file.versionsCount} versions
                </span>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-[#111915] truncate" title={file.originalPath}>
                  {file.originalPath.split('/').pop()}
                </p>
                <p className="text-[10px] font-mono text-[#75887B] truncate" title={file.originalPath}>
                  {file.originalPath}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F9FAF9] border border-[#E2EAE4] space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-[#75887B]">
                  <span>Size:</span>
                  <span className="text-[#111915] font-medium tabular-nums">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between text-[#75887B]">
                  <span>Snapshot:</span>
                  <span className="text-[#111915] font-medium">{file.backupTime}</span>
                </div>
                <div className="text-[9px] text-[#75887B] truncate pt-1 border-t border-[#E2EAE4]">
                  SHA-256: {file.hash.slice(0, 20)}...
                </div>
              </div>
            </div>

            {/* Restore Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleRestore(file.originalPath, true)}
                className="flex-1 py-2 rounded-xl bg-[#F4F7F5] hover:bg-[#EAF0EB] border border-[#E2EAE4] text-[11px] font-mono font-medium text-[#111915] transition-colors flex items-center justify-center gap-1.5"
                title="Restore to side-path without overwriting current file"
              >
                <RotateCcw className="size-3" />
                <span>Side-Path</span>
              </button>

              <button
                onClick={() => handleRestore(file.originalPath, false)}
                className="flex-1 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-mono font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                title="Overwrite target with vaulted version"
              >
                <ShieldCheck className="size-3" />
                <span>Overwrite</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
