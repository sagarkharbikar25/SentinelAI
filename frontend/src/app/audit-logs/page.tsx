import React from 'react';
import { FileText, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-400" /> Audit Log Viewer
        </h2>
        <p className="text-xs text-gray-400">
          Append-only security event timeline, SHA-256 prompt hash inspection, and decision audit logs (Member 2 — Semester 6 Ready).
        </p>
      </div>

      <div className="p-12 rounded-xl bg-[#16181D] border border-[#262933] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Audit Log Timeline Placeholder</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Semester 5 foundation is active. In Semester 6, this view will render live append-only audit events from the <code className="text-blue-400">audit_logs</code> database table.
        </p>
      </div>
    </div>
  );
}
