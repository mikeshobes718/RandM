"use client";

import { useState } from "react";
import Link from "next/link";

interface Campaign {
  id?: string;
  name: string;
  type?: string;
  sent: number;
  clicks: number;
  failed?: number;
  lastError?: string;
  date: string;
}

interface ReviewRequestsModuleProps {
  used: number;
  limit: number;
  recentCampaigns: Campaign[];
  isPro: boolean;
  deliveredRate?: number;
  clickRate?: number;
  optOutRate?: number;
}

export default function ReviewRequestsModule({ 
  used, 
  limit, 
  recentCampaigns, 
  isPro,
  deliveredRate = 98.4,
  clickRate = 0,
  optOutRate = 0.8
}: ReviewRequestsModuleProps) {

  const [resending, setResending] = useState<string | null>(null);

  const handleResend = async (campaignId: string) => {
    if (!confirm('Resend this campaign to all contacts?')) return;
    setResending(campaignId);
    try {
      const user = (await import('@/lib/firebaseClient')).clientAuth.currentUser;
      if (!user) return;
      const tok = await user.getIdToken(true);
      const res = await fetch('/api/campaigns/resend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}` 
        },
        body: JSON.stringify({ campaignId })
      });
      if (res.ok) {
        alert('Resend complete!');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to resend campaign');
      }
    } catch (e) {
      console.error('Error resending campaign:', e);
      alert('Connection error. Please try again.');
    } finally {
      setResending(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign record?')) return;
    try {
      const user = (await import('@/lib/firebaseClient')).clientAuth.currentUser;
      if (!user) return;
      const tok = await user.getIdToken(true);
      const res = await fetch(`/api/campaigns/list?id=${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Error deleting campaign:', e);
    }
  };

  return (
    <div className="premium-card p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Review Requests
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded uppercase tracking-widest">Active</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Send SMS & Email invitations to your customers.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/requests/new" className="primary-button !h-11 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">
            Send Requests
          </Link>
          <Link href="/contacts" className="secondary-button !h-11 px-4 text-xs font-black uppercase tracking-widest">
            Import
          </Link>
          <Link href="/templates" className="secondary-button !h-11 px-4 text-xs font-black uppercase tracking-widest">
            Templates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requests Sent</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{used}</span>
            <span className="text-xs font-bold text-slate-400">/ {limit === 999999 ? '∞' : limit}</span>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered (SMS)</p>
          <span className="text-xl font-black text-emerald-600">{deliveredRate}%</span>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Click Rate</p>
          <span className="text-xl font-black text-brand">{clickRate}%</span>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opt-out Rate</p>
          <span className="text-xl font-black text-slate-400">{optOutRate}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Recent Outbound Sends</h4>
        <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
        {recentCampaigns.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-bold">No campaigns sent yet this month.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCampaigns.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-brand/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    {c.type?.toLowerCase() === 'sms' ? '📱' : '✉️'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{c.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(c.date).toLocaleDateString()} • {c.type || 'Email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-xs font-black text-slate-900">{c.sent} sent</p>
                      {c.failed > 0 && (
                        <div className="group/err relative">
                          <p className="text-[8px] font-bold text-red-500 uppercase tracking-tight cursor-help">{c.failed} failed</p>
                          {c.lastError && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[8px] rounded shadow-xl opacity-0 group-hover/err:opacity-100 transition-opacity z-50 pointer-events-none">
                              {c.lastError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-brand uppercase tracking-widest">{c.clicks} clicks</p>
                  </div>
                  {c.id && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleResend(c.id!)}
                        disabled={resending === c.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-brand hover:bg-brand/5 transition-all"
                        title="Resend this campaign"
                      >
                        {resending === c.id ? (
                          <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteCampaign(c.id!)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                      title="Delete campaign record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-[20px] text-white">
          <span className="text-xl">ℹ️</span>
          <p className="text-[10px] font-medium leading-relaxed opacity-80">
            <strong>What counts as a "Review Request"?</strong> One outbound SMS or email sent by the system to a customer. QR scans do <u>not</u> count as requests and are always unlimited.
          </p>
        </div>
      </div>
    </div>
  );
}
