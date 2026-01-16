"use client";

import Link from "next/link";

interface ContactsPanelProps {
  count: number;
  lastImportDate?: string | null;
  lastImportSource?: string | null;
}

export default function ContactsPanel({ count, lastImportDate, lastImportSource }: ContactsPanelProps) {
  return (
    <div className="premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900">Contacts</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Your marketing list</p>
        </div>
        <Link href="/contacts/import" className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">
          Import Contacts
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stored</p>
          <span className="text-xl font-black text-slate-900">{count}</span>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready</span>
        </div>
      </div>

      {lastImportDate && (
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
          <span>Last import: {new Date(lastImportDate).toLocaleDateString()} via {lastImportSource || 'CSV'}</span>
        </div>
      )}
    </div>
  );
}
