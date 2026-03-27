"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  comment: string | null;
  rating: number;
  created_at: string;
  type: 'feedback' | 'contact' | 'google' | 'event';
  status?: 'open' | 'resolved';
}

interface FeedbackInboxProps {
  initialItems: FeedbackItem[];
  businessId: string;
}

export default function FeedbackInbox({ initialItems, businessId }: FeedbackInboxProps) {
  const [filter, setFilter] = useState<'all' | 'negative' | 'neutral' | 'positive' | 'needs_response'>('all');
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.reviewsandmarketing.com';
    const url = `${origin}/r/${businessId}?source=followup`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(`resolved_feedback_${businessId}`);
    if (saved) {
      try {
        setResolvedIds(JSON.parse(saved));
      } catch { }
    }
  }, [businessId]);

  useEffect(() => {
    setItems(initialItems.map(item => ({
      ...item,
      status: resolvedIds.includes(item.id) ? 'resolved' : 'open'
    })));
  }, [initialItems, resolvedIds]);

  const handleResolve = async (id: string) => {
    const isResolved = resolvedIds.includes(id);
    const newResolved = isResolved
      ? resolvedIds.filter(rid => rid !== id)
      : [...resolvedIds, id];

    setResolvedIds(newResolved);
    localStorage.setItem(`resolved_feedback_${businessId}`, JSON.stringify(newResolved));

    // Also sync with backend if possible
    try {
      const idToken = localStorage.getItem('idToken');
      await fetch('/api/feedback/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, archived: !isResolved })
      });
    } catch (e) {
      console.error('Archive sync failed:', e);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (item.status === 'resolved') return false; // Always hide archived items from inbox
      if (filter === 'all') return true;
      if (filter === 'negative') return item.rating <= 2;
      if (filter === 'neutral') return item.rating === 3;
      if (filter === 'positive') return item.rating >= 4;
      if (filter === 'needs_response') return item.status === 'open' && item.type === 'feedback';
      return true;
    });
  }, [items, filter]);

  return (
    <section className="surface-card p-8 rounded-3xl bg-surface border border-outline-variant/20 shadow-xl shadow-outline-variant/20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-on-surface">Feedback Inbox</h2>
        <Link 
          href="/feedback" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-outline-variant/30 shadow-sm"
        >
          View All Activity
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'all', label: 'All' },
          { id: 'negative', label: 'Negative' },
          { id: 'neutral', label: 'Neutral' },
          { id: 'positive', label: 'Positive' },
          { id: 'needs_response', label: 'Needs Response' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id
              ? 'bg-inverse-surface text-white shadow-lg'
              : 'bg-surface text-on-surface-variant/60 border border-outline-variant/30 hover:border-outline-variant/40'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center mb-4 text-2xl">📥</div>
            <h3 className="text-sm font-bold text-on-surface mb-1">Clear for now</h3>
            <p className="text-xs text-on-surface-variant/60 font-medium">No feedback matches your current filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEvent = item.type === 'event';
            const isResolved = item.status === 'resolved';

            return (
              <div key={item.id} className={`p-5 rounded-2xl border transition-all ${isResolved ? 'bg-surface-container-lowest/50 border-outline-variant/20 opacity-60' : 'bg-surface border-outline-variant/20 shadow-sm hover:shadow-md hover:border-outline-variant/30'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border ${item.rating >= 4 ? 'bg-emerald-50 text-emerald-600' :
                      item.rating <= 2 ? 'bg-rose-500 text-white border-none shadow-lg shadow-rose-200 animate-pulse' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                      {isEvent ? '🚀' : item.rating >= 4 ? '⭐️' : '⚠️'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-on-surface truncate">{isEvent ? 'Verified Redirect' : (item.name || 'Anonymous')}</h4>
                        {!isEvent && item.rating <= 2 && !isResolved && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded uppercase tracking-tighter flex-shrink-0">Urgent</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex-shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                        {!isEvent && item.email && (
                          <a href={`mailto:${item.email}`} className="text-[10px] font-bold text-on-surface-variant/60 hover:text-brand transition-colors uppercase tracking-widest flex items-center gap-1 truncate">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            <span className="truncate">{item.email}</span>
                          </a>
                        )}
                        {!isEvent && item.phone && (
                          <a href={`sms:${item.phone}`} className="text-[10px] font-bold text-on-surface-variant/60 hover:text-brand transition-colors uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {item.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isEvent && (
                    <div className={`px-2 py-1 rounded-lg flex-shrink-0 text-[10px] font-black uppercase tracking-widest ${item.rating >= 4 ? 'bg-emerald-100 text-emerald-700' :
                      item.rating === 3 ? 'bg-surface-container-low text-on-surface-variant' :
                        'bg-rose-600 text-white shadow-sm'
                      }`}>
                      {item.rating} Stars
                    </div>
                  )}
                </div>

                <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-4 italic">
                  {isEvent ? 'Customer was successfully routed to your Google Profile to leave a public review.' : `"${item.comment || 'No comment provided'}"`}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                  {item.email && (
                    <a 
                      href={`mailto:${item.email}?subject=Feedback regarding your experience`}
                      className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hover:text-brand transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {item.email}
                    </a>
                  )}
                  {item.phone && (
                    <a 
                      href={`sms:${item.phone}`}
                      className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hover:text-brand transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      {item.phone}
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 mt-4 border-t border-outline-variant/20">
                  {item.email && (
                    <button
                      onClick={() => window.location.href = `mailto:${item.email}?subject=Feedback regarding your experience`}
                      className="px-3 py-2 bg-inverse-surface text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex-1 sm:flex-none text-center shadow-sm"
                    >
                      Email
                    </button>
                  )}
                  {item.phone && (
                    <button
                      onClick={() => window.location.href = `sms:${item.phone}`}
                      className="px-3 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex-1 sm:flex-none text-center shadow-sm"
                    >
                      Text
                    </button>
                  )}
                  {!isEvent && (
                    <button
                      onClick={(e) => handleCopyLink(e, item.id)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all flex-1 sm:flex-none text-center shadow-sm"
                    >
                      {copiedId === item.id ? 'Copied!' : 'Copy Review Link'}
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(item.id)}
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border flex-1 sm:flex-none text-center sm:ml-auto shadow-sm ${isResolved ? 'bg-surface text-on-surface-variant/60 border-outline-variant/30' : 'bg-surface text-rose-600 border-rose-200 hover:bg-rose-50'
                      }`}
                  >
                    {isResolved ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
