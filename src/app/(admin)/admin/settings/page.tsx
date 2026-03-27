"use client";

import { useState } from "react";

export default function AdminSettings() {
  const [commissions, setCommissions] = useState({
    firstClose: 100,
    month2: 25,
    month3: 25,
    bonus10: 100,
    bonus20: 250,
  });

  const inputClass = "h-14 px-6 rounded-2xl bg-surface-container-lowest border-none focus:ring-2 focus:ring-brand/20 text-sm font-bold transition-all";

  return (
    <div className="max-w-4xl animate-fade-in space-y-12">
      <div>
        <h1 className="text-3xl font-black text-on-surface tracking-tight">Admin Settings</h1>
        <p className="text-on-surface-variant font-medium mt-1">Configure global commission structures and notifications.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Commission Structure */}
        <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-on-surface">Commission Structure</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">First Close (%)</label>
              <div className="relative">
                <input type="number" value={commissions.firstClose} className={inputClass + " w-full pr-12 text-right"} />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/60">%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">Month 2 Retention (%)</label>
                <div className="relative">
                  <input type="number" value={commissions.month2} className={inputClass + " w-full pr-12 text-right"} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/60">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">Month 3 Retention (%)</label>
                <div className="relative">
                  <input type="number" value={commissions.month3} className={inputClass + " w-full pr-12 text-right"} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/60">%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">10+ Closes Bonus ($)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/60">$</span>
                  <input type="number" value={commissions.bonus10} className={inputClass + " w-full pl-12 text-right"} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">20+ Closes Bonus ($)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/60">$</span>
                  <input type="number" value={commissions.bonus20} className={inputClass + " w-full pl-12 text-right"} />
                </div>
              </div>
            </div>
          </div>
          <button className="w-full h-14 bg-inverse-surface text-white font-black rounded-2xl shadow-lg transition-all hover:shadow-xl">
            Save Commission Plan
          </button>
        </div>

        {/* Notifications */}
        <div className="space-y-8">
          <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-on-surface">Notifications</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: "Email me on new close", enabled: true },
                { label: "Email me on customer churn", enabled: true },
                { label: "Email me when rep inactive 3+ days", enabled: false },
                { label: "Weekly performance report", enabled: true }
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest cursor-pointer group">
                  <span className="text-sm font-bold text-on-surface-variant">{item.label}</span>
                  <div className={`w-12 h-6 rounded-full relative transition-all ${item.enabled ? 'bg-brand' : 'bg-outline-variant/40'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.enabled ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-inverse-surface p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-xl font-black mb-4">Rep Portal Access</h3>
            <p className="text-sm text-on-surface-variant/60 font-medium mb-6">Current portal URL for sales representatives:</p>
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-brand-light">
              https://www.reviewsandmarketing.com/sales-portal
              <button className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-2m-6-6L14 7m0 0l-3-3m3 3l3 3m-3-3v10" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
