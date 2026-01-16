"use client";

import Link from "next/link";

interface PlanUsageCardProps {
  planName: string;
  requestsUsed: number;
  requestsLimit: number;
  qrScans: number;
  isUnlimited: boolean;
}

export default function PlanUsageCard({ planName, requestsUsed, requestsLimit, qrScans, isUnlimited }: PlanUsageCardProps) {
  const progress = isUnlimited ? 0 : Math.min(100, (requestsUsed / requestsLimit) * 100);

  return (
    <div className="premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
          <h3 className="text-xl font-black text-slate-900 capitalize">{planName}</h3>
        </div>
        {!isUnlimited && (
          <Link href="/pricing" className="px-4 py-2 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-all">
            Upgrade
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Requests</span>
            <span className="text-xs font-black text-slate-900">{requestsUsed} / {isUnlimited ? '∞' : requestsLimit}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-brand'}`} 
              style={{ width: `${isUnlimited ? 0 : progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-base">📱</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QR Scans</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900">{qrScans}</span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">Unlimited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
