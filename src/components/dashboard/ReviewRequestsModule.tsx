"use client";

import { useState } from "react";
import Link from "next/link";
import { clientAuth } from '@/lib/firebaseClient';
import { MiniHowItWorks } from '@/components/MiniHowItWorks';
import { Users, MessageSquareText, Send, BarChart3 } from 'lucide-react';

interface Campaign {
  id?: string;
  name: string;
  type?: string;
  sent: number;
  clicks: number;
  body?: string | null;
  failed?: number;
  lastError?: string;
  recipients?: { contact: string; status: 'sent' | 'failed'; error?: string }[];
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
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResending(null);
      } else {
        setResending(null);
        console.error('[ReviewRequests] Resend failed:', data.error);
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
      // No-op for now; parent should refresh data
    } catch (e) {
      console.error('[ReviewRequests] Delete error:', e);
    }
  };

  return (
    <div className="surface-card p-8 rounded-[32px] bg-surface border border-outline-variant/20 shadow-xl shadow-outline-variant/20 relative overflow-hidden h-full">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-lg">🚀</div>
            <h2 className="text-2xl font-black text-on-surface flex items-center gap-2">
              Customer Outreach
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded uppercase tracking-widest">Active</span>
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant font-bold leading-relaxed mb-4">
            Manage your database and send SMS or Email invitations to your customers.
          </p>
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 mb-6">
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
              "All your contacts are organized here so you can send rebates, coupons, upcoming promotions, review requests, and thank-yous to your customers to get them back into your store!"
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contacts?outreach=1" className="primary-button !h-12 px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 flex-1 sm:flex-none text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Send Outreach
            </Link>
            <Link href="/contacts" className="secondary-button !h-12 px-6 text-xs font-black uppercase tracking-widest flex-1 sm:flex-none text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Import Contacts
            </Link>
          </div>
        </div>
        <div className="lg:w-[300px] p-6 bg-inverse-surface rounded-[24px] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4">Quick Stats</p>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Sent</p>
              <p className="text-xl font-black">{used}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Click Rate</p>
              <p className="text-xl font-black text-emerald-400">{clickRate}%</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[9px] text-white/50 font-medium leading-relaxed">
              SMS and Email outreach includes all manual and automated campaigns.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-center">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Monthly Limit</p>
          <span className="text-lg font-black text-on-surface">{limit === 999999 ? '∞' : limit}</span>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-center">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Delivered</p>
          <span className="text-lg font-black text-emerald-600">{deliveredRate}%</span>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-center">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Interaction</p>
          <span className="text-lg font-black text-brand">{clickRate}%</span>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-center">
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1">Opt-out</p>
          <span className="text-lg font-black text-on-surface-variant/60">{optOutRate}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest border-b border-outline-variant/20 pb-2">Recent Outbound Sends</h4>
        <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
        {recentCampaigns.length === 0 ? (
          <div className="py-12 text-center bg-surface-container-lowest/50 rounded-2xl border border-dashed border-outline-variant/30 px-6">
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-outline-variant/20 text-xl">
              ✉️
            </div>
            <p className="text-xs font-black text-on-surface uppercase tracking-widest mb-1">No campaigns yet</p>
            <p className="text-[10px] text-on-surface-variant/60 font-medium max-w-[200px] mx-auto mb-6">
              Start by importing your customers or sending a manual request.
            </p>
            <Link href="/contacts?outreach=1" className="inline-flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest hover:underline">
              Send your first outreach →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCampaigns.map((c, i) => (
              <div key={i} className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/20 group hover:border-brand/30 transition-all overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => toggleRow(i)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shadow-sm text-sm border border-outline-variant/20 group-hover:scale-110 transition-transform">
                      {c.type?.toLowerCase() === 'sms' ? '📱' : '✉️'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-on-surface">{c.name}</p>
                      <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase">{new Date(c.date).toLocaleDateString()} • {c.type || 'Email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-xs font-black text-on-surface">{c.sent} sent</p>
                        {c.failed && c.failed > 0 ? (
                          <p className="text-[8px] font-bold text-red-500 uppercase tracking-tight">{c.failed} failed</p>
                        ) : null}
                      </div>
                      <p className="text-[9px] font-bold text-brand uppercase tracking-widest">{c.clicks} clicks</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {c.id && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResend(c.id!); }}
                            disabled={resending === c.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/40 hover:text-brand hover:bg-brand/5 transition-all"
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
                            onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id!); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 transition-all ml-1"
                            title="Delete campaign record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      <svg className={`w-4 h-4 text-on-surface-variant/60 transition-transform ${expandedRow === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedRow === i && (
                  <div className="px-4 pb-4 pt-2 border-t border-outline-variant/20 bg-white/50">
                    {c.body && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Message Content</p>
                        <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 text-[11px] text-on-surface-variant whitespace-pre-wrap font-medium">
                          {c.body}
                        </div>
                      </div>
                    )}
                    {c.recipients && c.recipients.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Recipients</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                          {c.recipients.map((r, idx) => (
                            <div key={idx} className={`flex flex-col gap-0.5 text-[11px] p-2 rounded-lg ${r.status === 'failed' ? 'bg-red-50/60' : 'bg-surface-container-lowest/60'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-on-surface-variant font-medium truncate">{r.contact}</span>
                                  <Link 
                                    href={`/contacts?search=${encodeURIComponent(r.contact)}`}
                                    className="flex-shrink-0 text-[9px] font-black text-brand uppercase tracking-widest hover:underline"
                                  >
                                    View History →
                                  </Link>
                                </div>
                                <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest ${r.status === 'sent' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {r.status === 'sent' ? 'Delivered' : 'Failed'}
                                </span>
                              </div>
                              {r.status === 'failed' && r.error && (
                                <p className="text-[10px] text-red-400 mt-0.5">{r.error}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : c.lastError ? (
                      <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Error Detail</p>
                        <p className="text-[11px] text-red-500">{c.lastError}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-on-surface-variant/60 italic">No detailed data available for this campaign. Campaigns sent after this update will include per-recipient status.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <MiniHowItWorks 
        className="mt-6 bg-surface-container-lowest/50 border-outline-variant/10 shadow-none"
        title="How Customer Outreach Works"
        steps={[
          { icon: Users, title: "1. Import Contacts", desc: "Upload a CSV or add your customers manually." },
          { icon: MessageSquareText, title: "2. Craft Message", desc: "Write a custom SMS or Email inviting them back." },
          { icon: Send, title: "3. Send Campaign", desc: "Blast your message out to your selected audience." },
          { icon: BarChart3, title: "4. Track Results", desc: "Monitor clicks, deliveries, and new reviews generated." }
        ]}
      />
    </div>
  );
}
