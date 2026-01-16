"use client";

import { useMemo } from "react";

const STATS = [
  { label: "MRR", value: "$12,450", change: "+8%", color: "text-brand" },
  { label: "Active Customers", value: "248", change: "+12", color: "text-slate-900" },
  { label: "Active Reps", value: "14", change: "+2", color: "text-slate-900" },
  { label: "Closes This Week", value: "32", change: "+5", color: "text-emerald-500" },
  { label: "Commissions Owed", value: "$4,200", change: "-$150", color: "text-amber-500" },
];

const RECENT_ACTIVITY = [
  { time: "2 min ago", event: 'Maria closed "Smile Dental"', detail: "$50/mo", type: "close" },
  { time: "1 hour ago", event: "John logged 15 calls", detail: "NY Area", type: "log" },
  { time: "3 hours ago", event: 'David closed "Boutique Gym"', detail: "$99/mo", type: "close" },
  { time: "Yesterday", event: 'Customer "Bright Teeth" churned', detail: "Starter Plan", type: "churn" },
  { time: "Yesterday", event: "Sarah joined as Trial Rep", detail: "Referral", type: "rep" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Welcome back, Mike. Here's what's happening today.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">{stat.label}</p>
            <div className="flex items-end gap-2 relative z-10">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className={`text-[10px] font-black mb-1 px-1.5 py-0.5 rounded ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                {stat.change}
              </p>
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
            <h3 className="text-lg font-bold text-slate-900">Revenue & Closes Chart</h3>
            <p className="text-sm text-slate-400 font-medium">Coming soon: interactive performance visualizer.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Top Reps this week</h4>
              <div className="space-y-4">
                {[
                  { name: "Maria L.", closes: 12, amount: "$600" },
                  { name: "David R.", closes: 9, amount: "$450" },
                  { name: "Sarah J.", closes: 7, amount: "$350" }
                ].map(rep => (
                  <div key={rep.name} className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-600">{rep.name}</p>
                    <p className="text-sm font-black text-slate-900">{rep.closes} closes</p>
                  </div>
                ))}
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
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          <h3 className="text-xl font-black mb-8 relative z-10">Recent Activity</h3>
          <div className="space-y-8 relative z-10">
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
