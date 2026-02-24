"use client";

import Link from "next/link";

interface PlanUsageCardProps {
  planName: string;
  requestsUsed: number;
  requestsLimit: number;
  qrScans: number;
  isUnlimited: boolean;
  isPro?: boolean;
  planStatus?: string;
}

// Simple Tooltip component
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <div className="group relative inline-block">
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
      {text}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  </div>
);

export default function PlanUsageCard({ planName, requestsUsed, requestsLimit, qrScans, isUnlimited, isPro, planStatus }: PlanUsageCardProps) {
  const progress = isUnlimited ? 0 : Math.min(100, (requestsUsed / requestsLimit) * 100);
  const isFree = !planStatus || planStatus === 'none' || planStatus === 'free';

  return (
    <section className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Left: Plan Info (Only show Upgrade if on Free plan) */}
        {isFree && (
          <div className="p-6 lg:p-8 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-4 min-w-[220px]">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{planName}</h3>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-5 h-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200">
              Upgrade
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Review Requests */}
          <div className="p-6 lg:p-8 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Review Requests</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">Monthly Allowance</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-900">{requestsUsed}</span>
                <span className="text-xs font-bold text-slate-300 ml-1">/ {isUnlimited ? '∞' : requestsLimit}</span>
              </div>
            </div>
            <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 shadow-sm ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-brand'}`} 
                style={{ width: `${isUnlimited ? '100%' : progress}%`, opacity: isUnlimited ? 0.15 : 1 }}
              />
            </div>
          </div>

          {/* QR Scans */}
          <div className="p-6 lg:p-8 flex flex-col justify-center bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">QR Scans</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">Active Traffic</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{qrScans}</span>
                  <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    {isPro ? 'Included' : 'Unlimited'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
