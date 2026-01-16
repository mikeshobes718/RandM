"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your customer list for outbound campaigns.</p>
        </div>
        <div className="flex gap-3">
           <button className="secondary-button !h-12 px-6 text-xs font-black uppercase tracking-widest">Download CSV</button>
           <button className="primary-button !h-12 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">Import Contacts</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-6 border border-slate-100">
            👥
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No contacts yet</h3>
          <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2 leading-relaxed">
            Import your customer list from a CSV file or connect your Square account to start sending requests.
          </p>
          <div className="mt-8 flex justify-center gap-4">
             <button className="h-12 px-8 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
               Upload CSV
             </button>
             <Link href="/integrations" className="h-12 px-8 border-2 border-slate-100 text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center">
               Connect Square
             </Link>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Accepted Formats:</span>
              <span className="bg-white px-2 py-1 rounded border border-slate-200">.CSV</span>
              <span className="bg-white px-2 py-1 rounded border border-slate-200">.XLSX</span>
           </div>
        </div>
      </div>
    </div>
  );
}
