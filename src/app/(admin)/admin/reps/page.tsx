"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReps() {
  const router = useRouter();
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchReps() {
      try {
        const res = await fetch('/api/admin/reps');
        const data = await res.json();
        setReps(data.reps || []);
      } catch (err) {
        console.error('Failed to fetch reps:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReps();
  }, []);

  const filteredReps = reps.filter(rep => {
    if (filter !== "All" && rep.status?.toLowerCase() !== filter.toLowerCase()) return false;
    if (search && !rep.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING REPS...</div>;

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4 text-left">Name</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-center">Leads</th>
                <th className="px-4 py-4 text-center">Calls</th>
                <th className="px-4 py-4 text-center">Closes</th>
                <th className="px-4 py-4 text-right">Earned</th>
                <th className="px-4 py-4 text-right">Owed</th>
                <th className="px-8 py-4 text-right">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredReps.map((rep) => {
                const calls = rep.calls_logged || 0;
                const closes = rep.closes || 0;
                
                // Flag logic
                const flags = [];
                if (rep.days_since_active > 3) flags.push({ label: 'Inactive', color: 'bg-red-100 text-red-600' });
                if (rep.avg_calls_per_day < 10) flags.push({ label: 'Low Activity', color: 'bg-amber-100 text-amber-600' });
                if (rep.closes_last_7_days >= 3) flags.push({ label: 'Hot Streak', color: 'bg-emerald-100 text-emerald-600' });

                return (
                  <tr 
                    key={rep.id} 
                    onClick={() => router.push(`/admin/reps/${rep.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900 group-hover:text-brand transition-colors">{rep.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{rep.email}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        rep.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        rep.status === 'trial' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center font-bold text-slate-700">{rep.leads_assigned || 0}</td>
                    <td className="px-4 py-5 text-center font-bold text-slate-700">{calls}</td>
                    <td className="px-4 py-5 text-center font-bold text-slate-900">{closes}</td>
                    <td className="px-4 py-5 text-right font-bold text-slate-900">${(rep.total_earned || 0).toLocaleString()}</td>
                    <td className="px-4 py-5 text-right font-black text-brand">${(rep.pending_payout || 0).toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        {flags.map(f => (
                          <span key={f.label} className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${f.color}`}>
                            {f.label}
                          </span>
                        ))}
                        {flags.length === 0 && <span className="text-slate-300">-</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
