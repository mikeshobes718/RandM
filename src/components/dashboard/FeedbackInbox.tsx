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
    <section className="premium-card p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-900">Feedback Inbox</h2>
        <Link 
          href="/feedback" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 shadow-sm"
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
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-2xl">📥</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Clear for now</h3>
            <p className="text-xs text-slate-400 font-medium">No feedback matches your current filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEvent = item.type === 'event';
            const isResolved = item.status === 'resolved';

            return (
              <div key={item.id} className={`p-5 rounded-2xl border transition-all ${isResolved ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${item.rating >= 4 ? 'bg-emerald-50 text-emerald-600' :
                      item.rating <= 2 ? 'bg-rose-500 text-white border-none shadow-lg shadow-rose-200 animate-pulse' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                      {isEvent ? '🚀' : item.rating >= 4 ? '⭐️' : '⚠️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{isEvent ? 'Verified Redirect' : (item.name || 'Anonymous')}</h4>
                        {!isEvent && item.rating <= 2 && !isResolved && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded uppercase tracking-tighter">Urgent</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                        {!isEvent && item.email && (
                          <a href={`mailto:${item.email}`} className="text-[10px] font-bold text-slate-400 hover:text-brand transition-colors uppercase tracking-widest flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            {item.email}
                          </a>
                        )}
                        {!isEvent && item.phone && (
                          <a href={`sms:${item.phone}`} className="text-[10px] font-bold text-slate-400 hover:text-brand transition-colors uppercase tracking-widest flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {item.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isEvent && (
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.rating >= 4 ? 'bg-emerald-100 text-emerald-700' :
                      item.rating === 3 ? 'bg-slate-100 text-slate-600' :
                        'bg-rose-600 text-white shadow-sm'
                      }`}>
                      {item.rating} Stars
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4 italic">
                  {isEvent ? 'Customer was successfully routed to your Google Profile to leave a public review.' : `"${item.comment || 'No comment provided'}"`}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                  {item.email && (
                    <a 
                      href={`mailto:${item.email}?subject=Feedback regarding your experience`}
                      className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {item.email}
                    </a>
                  )}
                  {item.phone && (
                    <a 
                      href={`sms:${item.phone}`}
                      className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      {item.phone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `mailto:${item.email}?subject=Feedback regarding your experience`}
                    className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all"
                  >
                    Email
                  </button>
                  {item.phone && (
                    <button
                      onClick={() => window.location.href = `sms:${item.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all"
                    >
                      Text
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(item.id)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border ${isResolved ? 'bg-white text-slate-400 border-slate-200' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
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
