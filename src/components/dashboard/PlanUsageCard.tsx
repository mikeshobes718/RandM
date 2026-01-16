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
    <div className="premium-card p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
            <h3 className="text-2xl font-black text-slate-900 capitalize">{planName}</h3>
          </div>
          {!isUnlimited && (
            <Link href="/pricing" className="px-4 py-2 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-all">
              Upgrade
            </Link>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Requests</span>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900 leading-none">{requestsUsed}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">/ {isUnlimited ? '∞' : requestsLimit}</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-brand'}`} 
                style={{ width: `${isUnlimited ? '100%' : progress}%`, opacity: isUnlimited ? 0.1 : 1 }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">📱</div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QR Scans</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="text-lg font-black text-slate-900 leading-none">{qrScans}</span>
              <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-100/50 px-2 py-1 rounded-lg">Unlimited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
