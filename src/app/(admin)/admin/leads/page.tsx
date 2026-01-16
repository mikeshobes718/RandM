"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/admin/leads');
        const data = await res.json();
        setLeads(data.leads || []);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== "All" && lead.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search && !lead.business_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING LEADS...</div>;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lead Pool</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor all potential leads and their assignment status.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin/leads/upload" 
            className="h-14 px-8 bg-slate-100 text-slate-900 font-black rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            Upload CSV
          </Link>
          <button className="h-14 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Export Leads
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {["All", "Fresh", "Called", "Follow-up", "Closed", "Dead"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  statusFilter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Business Name</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4 text-center">Rating</th>
                <th className="px-4 py-4 text-center">Attempts</th>
                <th className="px-4 py-4">Assigned To</th>
                <th className="px-4 py-4 text-center">Call Status</th>
                <th className="px-8 py-4 text-right">Last Called</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-5 text-slate-500 font-medium">
                    {lead.city}, {lead.state}
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`font-black ${lead.rating <= 3.5 ? 'text-red-500' : 'text-amber-500'}`}>{lead.rating} ★</span>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">
                    {lead.times_called || 0}
                  </td>
                  <td className="px-4 py-5">
                    {lead.assigned_to_name ? (
                      <span className="text-slate-900 font-bold">{lead.assigned_to_name}</span>
                    ) : (
                      <button className="text-brand text-[10px] font-black uppercase tracking-widest hover:underline px-2 py-1 bg-brand/5 rounded">Assign</button>
                    )}
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      lead.call_status === 'fresh' ? 'bg-blue-50 text-blue-600' :
                      lead.call_status === 'closed' ? 'bg-emerald-50 text-emerald-600' :
                      lead.call_status === 'callback' ? 'bg-amber-50 text-amber-600' :
                      lead.call_status === 'no answer' ? 'bg-red-50 text-red-500' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {lead.call_status || 'fresh'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">
                    {lead.last_called_at ? new Date(lead.last_called_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
