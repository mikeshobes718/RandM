"use client";

import { useState } from "react";
import Link from "next/link";

const REPS = [
  { id: "1", name: "Maria Lopez", status: "Active", startDate: "Dec 1, 2025", leads: 142, calls: 840, closes: 24, commission: "$1,200", owed: "$450", lastActive: "2 min ago" },
  { id: "2", name: "John Smith", status: "Trial", startDate: "Jan 5, 2026", leads: 45, calls: 120, closes: 2, commission: "$100", owed: "$100", lastActive: "1 hour ago" },
  { id: "3", name: "David Ross", status: "Active", startDate: "Nov 15, 2025", leads: 210, calls: 1150, closes: 31, commission: "$1,550", owed: "$0", lastActive: "3 hours ago" },
  { id: "4", name: "Sarah Jenkins", status: "Dropped", startDate: "Oct 10, 2025", leads: 80, calls: 300, closes: 5, commission: "$250", owed: "$0", lastActive: "2 months ago" },
];

export default function AdminReps() {
  const [filter, setFilter] = useState("All");

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Representatives</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and monitor your team's performance.</p>
        </div>
        <Link 
          href="/admin/reps/add" 
          className="h-14 px-8 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Rep
        </Link>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Active", "Trial", "Inactive", "Dropped"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search reps..." 
              className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4 text-left">Name</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Start Date</th>
                <th className="px-4 py-4 text-center">Leads</th>
                <th className="px-4 py-4 text-center">Calls</th>
                <th className="px-4 py-4 text-center">Closes</th>
                <th className="px-4 py-4 text-center">Close Rate</th>
                <th className="px-4 py-4 text-right">Earned</th>
                <th className="px-4 py-4 text-right">Owed</th>
                <th className="px-8 py-4 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {REPS.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-brand transition-colors">{rep.name}</p>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      rep.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      rep.status === 'Trial' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-slate-500 font-medium">{rep.startDate}</td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">{rep.leads}</td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">{rep.calls}</td>
                  <td className="px-4 py-5 text-center font-bold text-slate-900">{rep.closes}</td>
                  <td className="px-4 py-5 text-center font-black text-slate-900">
                    {((rep.closes / rep.calls) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-5 text-right font-bold text-slate-900">{rep.commission}</td>
                  <td className="px-4 py-5 text-right font-black text-brand">{rep.owed}</td>
                  <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">{rep.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
