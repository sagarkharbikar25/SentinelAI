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
      ? `Restored safely to side-path: ${filePath}.restored.timestamp`
      : `Restored and overwritten in-place: ${filePath}`;
    setRestoreMessage(msg);
    setTimeout(() => setRestoreMessage(null), 4000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3F4850]/40 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#DFE2F0] flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-[#93CCFF]" />
            TIME-MACHINE BACKUP VAULT
          </h1>
          <p className="text-[#8A96A8] text-[11px] mt-0.5">
            Content-addressed SHA-256 deduplicated file storage & version recovery
          </p>
        </div>

        {/* Global Quota Bar */}
        <div className="w-64 p-3 rounded-lg bg-[#141824] border border-[#3F4850]/40">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-[#8A96A8] flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-[#93CCFF]" /> QUOTA
            </span>
            <span className="text-[#DFE2F0] font-semibold">1.4 GB / 10 GB</span>
          </div>
          <div className="w-full bg-[#0A0E17] h-2 rounded-full overflow-hidden border border-[#3F4850]/40">
            <div className="bg-[#4EDEA3] h-full" style={{ width: '14%' }}></div>
          </div>
        </div>
      </div>

      {/* Restore Toast Notification */}
      {restoreMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#4EDEA3] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A96A8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search backed up files or paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#141824] border border-[#3F4850]/40 text-[#DFE2F0] placeholder-[#8A96A8] focus:outline-none focus:border-[#93CCFF]/60 text-xs font-mono"
          />
        </div>
      </div>

      {/* Vault File Table */}
      <div className="rounded-xl border border-[#3F4850]/40 bg-[#0E121B] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#141824] text-[11px] text-[#8A96A8] uppercase border-b border-[#3F4850]/40">
            <tr>
              <th className="py-3 px-4">Original File Path</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Content Hash (SHA-256)</th>
              <th className="py-3 px-4">Last Backup</th>
              <th className="py-3 px-4 text-right">Recovery Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3F4850]/30 text-[11px] text-[#C5CDD9]">
            {filteredFiles.map((file) => (
              <tr key={file.id} className="hover:bg-[#131722] transition">
                <td className="py-3.5 px-4 font-semibold text-[#DFE2F0] flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#93CCFF] shrink-0" />
                  <span className="truncate max-w-md">{file.originalPath}</span>
                </td>
                <td className="py-3.5 px-4 font-mono">{file.sizeBytes} B</td>
                <td className="py-3.5 px-4 font-mono text-[#8A96A8] text-[10px]">
                  {file.hash.slice(0, 16)}...
                </td>
                <td className="py-3.5 px-4 text-[#8A96A8]">{file.backupTime}</td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleRestore(file.originalPath, true)}
                    className="px-2.5 py-1 rounded bg-[#181E2B] hover:bg-[#202738] text-[#93CCFF] border border-[#93CCFF]/30 font-semibold transition"
                  >
                    Side-Path Restore
                  </button>
                  <button
                    onClick={() => handleRestore(file.originalPath, false)}
                    className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-[#FF5449] border border-red-500/30 font-semibold transition"
                  >
                    Overwrite
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
