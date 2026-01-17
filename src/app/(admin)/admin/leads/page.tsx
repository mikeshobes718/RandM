"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [repMetrics, setRepMetrics] = useState<any[]>([]);
  const [totalMetrics, setTotalMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/admin/leads');
        const data = await res.json();
        setLeads(data.leads || []);
        setRepMetrics(data.repMetrics || []);
        setTotalMetrics(data.totalMetrics || null);
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
    if (search && !lead.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING PERFORMANCE...</div>;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header & Total Metrics */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance Pool</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time metrics across all sales representatives.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/leads/upload" 
              className="h-14 px-8 bg-slate-100 text-slate-900 font-black rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Upload CSV
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "CALLS TODAY", value: totalMetrics?.callsToday || 0, color: "text-indigo-600" },
            { label: "APPOINTMENTS", value: totalMetrics?.appointments || 0, color: "text-amber-600" },
            { label: "CLOSES THIS MONTH", value: totalMetrics?.closesThisMonth || 0, color: "text-emerald-600" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 text-center group">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 group-hover:text-brand transition-colors">{stat.label}</p>
              <p className={`text-5xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rep Specific Performance */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand"></span>
            Representative Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Representative</th>
                <th className="px-4 py-4 text-center">Calls Today</th>
                <th className="px-4 py-4 text-center">Appointments</th>
                <th className="px-8 py-4 text-right">Closes (MTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {repMetrics.map((rep) => (
                <tr key={rep.rep_email} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{rep.rep_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{rep.rep_email}</p>
                  </td>
                  <td className="px-4 py-5 text-center font-black text-indigo-500 text-lg">{rep.calls_today}</td>
                  <td className="px-4 py-5 text-center font-black text-amber-500 text-lg">{rep.appointments_today}</td>
                  <td className="px-8 py-5 text-right font-black text-emerald-500 text-lg">{rep.closes_this_month}</td>
                </tr>
              ))}
              {repMetrics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                    No representative activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leads Table (Moved below) */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Leads from Call Log</h3>
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
                <th className="px-4 py-4 text-center">Attempts</th>
                <th className="px-4 py-4">Assigned To</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Last Called</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{lead.city}, {lead.state}</p>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">
                    {lead.times_called || 0}
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-slate-900 font-bold">{lead.assigned_to_name || 'Unassigned'}</span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      lead.status === 'fresh' ? 'bg-blue-50 text-blue-600' :
                      lead.status === 'closed' ? 'bg-emerald-50 text-emerald-600' :
                      lead.status === 'callback' ? 'bg-amber-50 text-amber-600' :
                      lead.status === 'no answer' ? 'bg-red-50 text-red-500' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {lead.status || 'fresh'}
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
