"use client";

import Link from "next/link";

interface ContactsPanelProps {
  count: number;
  lastImportDate?: string | null;
  lastImportSource?: string | null;
}

export default function ContactsPanel({ count, lastImportDate, lastImportSource }: ContactsPanelProps) {
  return (
    <div className="surface-card p-6 rounded-3xl bg-surface border border-outline-variant/20 shadow-xl shadow-outline-variant/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-on-surface">Contacts</h3>
          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">Your marketing list</p>
        </div>
        <Link href="/contacts" className="px-4 py-2 bg-inverse-surface text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">
          Import Contacts
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Stored</p>
          <span className="text-xl font-black text-on-surface">{count}</span>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Status</p>
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready</span>
        </div>
      </div>

      {lastImportDate && (
        <div className="mt-4 flex items-center gap-2 text-[10px] text-on-surface-variant/60 font-medium italic">
          <span>Last import: {new Date(lastImportDate).toLocaleDateString()} via {lastImportSource || 'CSV'}</span>
        </div>
      )}
    </div>
  );
}
