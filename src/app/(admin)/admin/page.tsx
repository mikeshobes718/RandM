"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString();
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mRes, bRes] = await Promise.all([
          fetch('/api/admin/overview'),
          fetch('/api/admin/lead-stats')
        ]);
        const mData = await mRes.json();
        const bData = await bRes.json();
        setMetrics(mData);
        setBreakdown(bData);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: "TOP REP ID", value: metrics.mostActiveRep || 'None', color: "text-brand" },
      { label: "Total Leads", value: (breakdown?.totalLeads || 0).toLocaleString(), color: "text-on-surface" },
      { label: "Customers", value: metrics.activeCustomers || 0, color: "text-on-surface" },
      { 
        label: "TOP CATEGORY", 
        value: metrics.mostPopularCategory 
          ? metrics.mostPopularCategory.charAt(0).toUpperCase() + metrics.mostPopularCategory.slice(1).toLowerCase() 
          : 'None', 
        color: "text-rose-600" 
      },
      { label: "Closes This Week", value: metrics.closesThisWeek || 0, color: "text-emerald-500" },
      { label: "Calls Today", value: metrics.callsToday || 0, color: "text-indigo-500" },
      { label: "Calls This Week", value: metrics.callsThisWeek || 0, color: "text-indigo-500" },
      { label: "Active Reps", value: metrics.activeReps || 0, color: "text-on-surface" },
    ];
  }, [metrics, breakdown]);

  const recentActivity = metrics?.recentActivity || [];

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest">Loading Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Business Overview</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Welcome back. Here is what is happening today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest">System Operational</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">{stat.label}</p>
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Lead Database Health */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Lead Database Health</h3>
                <p className="text-sm text-on-surface-variant font-medium">Coverage across {breakdown?.totalStates || 0} states</p>
              </div>
              <span className="px-3 py-1 bg-primary-fixed/30 rounded-lg text-primary text-[10px] font-bold uppercase tracking-wider">
                Live Data
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {(breakdown?.breakdown || []).slice(0, 4).map((item: any) => (
                <div key={item.state} className="p-3 bg-surface-container-low rounded-lg">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{item.state || 'Unknown'}</p>
                  <p className="text-lg font-extrabold text-on-surface">{item.count.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest px-2">
                <span>Top Performing States</span>
                <span>Lead Concentration</span>
              </div>
              {(breakdown?.breakdown || []).slice(0, 6).map((item: any) => {
                const maxLeads = breakdown?.breakdown?.[0]?.count || 1;
                const percentage = (item.count / maxLeads) * 100;
                return (
                  <div key={item.state} className="space-y-1.5">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tight">{item.state || 'Unknown'}</p>
                      <p className="text-xs font-black text-on-surface">{item.count.toLocaleString()} leads</p>
                    </div>
                    <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quick Portals Links */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm">
              <h4 className="text-xs font-bold text-on-surface mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Operational Portals
              </h4>
              <div className="space-y-3">
                {[
                  { name: "Sales Portal", link: "/sales-portal", icon: "📞" },
                  { name: "Admin Panel", link: "/admin", icon: "🛡️" },
                  { name: "User Dashboard", link: "/dashboard", icon: "🏢" }
                ].map((portal) => (
                  <Link 
                    key={portal.name}
                    href={portal.link}
                    className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:bg-surface-container-lowest hover:border-brand/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{portal.icon}</span>
                      <span className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{portal.name}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-on-surface-variant/50 group-hover:text-brand group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sales Conversion */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-on-surface mb-5 uppercase tracking-wider w-full text-left flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Lead Conversion
              </h4>
              <div className="text-center py-4">
                <p className="text-5xl font-black text-on-surface tracking-tighter mb-1">
                  {metrics.totalCalls > 0 
                    ? `${(((metrics.totalCloses || 0) / metrics.totalCalls) * 100).toFixed(1)}%` 
                    : '0%'}
                </p>
                <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Call-to-Close Rate</p>
              </div>
              <div className="mt-6 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                {metrics.totalAppointments || 0} Total Appointments
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-inverse-surface rounded-xl p-6 text-white relative overflow-hidden flex flex-col shadow-sm">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
          <h3 className="text-xl font-black mb-10 relative z-10 flex items-center justify-between">
            Recent Activity
            <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          </h3>
          <div className="space-y-8 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Listening for events...</p>
              </div>
            ) : (
              recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex gap-5 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-3.5 h-3.5 rounded-full mt-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)] border-2 border-inverse-surface transition-transform group-hover:scale-125 ${
                      item.type === 'close' ? 'bg-emerald-400' : 
                      item.type === 'churn' ? 'bg-rose-400' : 
                      item.type === 'rep' ? 'bg-brand' : 'bg-on-surface-variant/60'
                    }`}></div>
                    {i < recentActivity.length - 1 && <div className="w-[1px] h-full bg-white/10 my-1"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{formatRelativeTime(item.time)}</p>
                    <p className="text-[13px] font-bold text-white group-hover:text-brand transition-colors leading-snug">{item.event}</p>
                    <p className="text-[11px] text-white/50 font-medium mt-1 uppercase tracking-wider">{item.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/admin/calls" className="w-full mt-8 py-3 rounded-lg bg-surface/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface/10 hover:border-white/20 transition-all text-white/60 hover:text-white flex items-center justify-center">
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
