"use client";

import { useMemo, useEffect, useState } from "react";

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/overview');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const stats = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: "MRR", value: `$${metrics.mrr.toLocaleString()}`, color: "text-brand" },
      { label: "Active Customers", value: metrics.activeCustomers, color: "text-slate-900" },
      { label: "Active Reps", value: metrics.activeReps, color: "text-slate-900" },
      { label: "Closes This Week", value: metrics.closesThisWeek, color: "text-emerald-500" },
      { label: "Commissions Owed", value: `$${(metrics.commissionsOwed || 0).toLocaleString()}`, color: "text-amber-500" },
      { label: "Calls Today", value: metrics.callsToday || 0, color: "text-indigo-500" },
      { label: "Calls This Week", value: metrics.callsThisWeek || 0, color: "text-indigo-500" },
      { label: "Call-to-Close", value: metrics.totalCalls > 0 ? `${((metrics.totalCloses / metrics.totalCalls) * 100).toFixed(1)}%` : '0%', color: "text-rose-500" },
    ];
  }, [metrics]);

  const RECENT_ACTIVITY = [
    { time: "2 min ago", event: 'Maria closed "Smile Dental"', detail: "$50/mo", type: "close" },
    { time: "1 hour ago", event: "John logged 15 calls", detail: "NY Area", type: "log" },
    { time: "3 hours ago", event: 'David closed "Boutique Gym"', detail: "$99/mo", type: "close" },
    { time: "Yesterday", event: 'Customer "Bright Teeth" churned', detail: "Starter Plan", type: "churn" },
    { time: "Yesterday", event: "Sarah joined as Trial Rep", detail: "Referral", type: "rep" },
  ];

  if (loading) return <div className="p-12 text-center font-black animate-pulse">LOADING OVERVIEW...</div>;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Welcome back, Mike. Here's what's happening today.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">{stat.label}</p>
            <div className="flex items-end gap-2 relative z-10">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Charts Placeholder */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent"></div>
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Call Activity by Rep</h3>
            <p className="text-sm text-slate-400 font-medium">Daily call volume tracking per salesperson.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Active Rep Performance</h4>
              <div className="space-y-4">
                {metrics?.repActivity?.map((rep: any) => (
                  <div key={rep.name} className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-600">{rep.name}</p>
                    <p className="text-sm font-black text-slate-900">{rep.call_count} calls <span className="text-slate-400 font-medium ml-1 text-[10px]">(this week)</span></p>
                  </div>
                )) || <p className="text-xs text-slate-400 italic">No activity logged this week.</p>}
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Churn Stats</h4>
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <p className="text-3xl font-black text-red-500">2.4%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Churn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          <h3 className="text-xl font-black mb-8 relative z-10">Recent Activity</h3>
          <div className="space-y-8 relative z-10 flex-1">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shadow-[0_0_10px_rgba(255,255,255,0.2)] ${
                    item.type === 'close' ? 'bg-emerald-400' : 
                    item.type === 'churn' ? 'bg-red-400' : 
                    item.type === 'rep' ? 'bg-brand' : 'bg-slate-500'
                  }`}></div>
                  {i < RECENT_ACTIVITY.length - 1 && <div className="w-0.5 h-full bg-white/5 my-1"></div>}
                </div>
                <div className="pb-2">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">{item.time}</p>
                  <p className="text-sm font-bold text-white group-hover:text-brand-light transition-colors">{item.event}</p>
                  <p className="text-xs text-white/60 font-medium">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
