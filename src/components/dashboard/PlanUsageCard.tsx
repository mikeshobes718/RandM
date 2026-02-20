"use client";

import Link from "next/link";

interface PlanUsageCardProps {
  planName: string;
  requestsUsed: number;
  requestsLimit: number;
  qrScans: number;
  isUnlimited: boolean;
  isPro?: boolean;
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

export default function PlanUsageCard({ planName, requestsUsed, requestsLimit, qrScans, isUnlimited, isPro }: PlanUsageCardProps) {
  const progress = isUnlimited ? 0 : Math.min(100, (requestsUsed / requestsLimit) * 100);

  return (
    <section className="premium-card p-5 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-center gap-8">
        {!isPro && (
          <div className="flex items-center justify-between md:border-r md:border-slate-100 md:pr-8 min-w-[200px]">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
              <h3 className="text-xl font-black text-slate-900 leading-none">{planName}</h3>
            </div>
            <Link href="/pricing" className="secondary-button !h-8 px-4 !text-[10px] font-black shadow-sm">
              Upgrade
            </Link>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Requests</span>
                <Tooltip text="Monthly automated review requests sent to customers.">
                  <span className="text-slate-300 cursor-help">ⓘ</span>
                </Tooltip>
              </div>
              <div className="text-xs font-black text-slate-900">
                {requestsUsed} <span className="text-slate-400 font-bold">/ {isUnlimited ? '∞' : requestsLimit}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-brand'}`} 
                style={{ width: `${isUnlimited ? '100%' : progress}%`, opacity: isUnlimited ? 0.1 : 1 }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-[180px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">📱</div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QR Scans</span>
                  <Tooltip text="Total times your QR codes have been scanned this month.">
                    <span className="text-slate-300 cursor-help">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="text-xs font-black text-slate-900">{qrScans}</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-widest border border-emerald-100">
              {isPro ? 'Included' : 'Unlimited'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
