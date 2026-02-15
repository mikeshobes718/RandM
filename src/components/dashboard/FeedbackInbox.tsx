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

  const handleResolve = (id: string) => {
    const newResolved = resolvedIds.includes(id)
      ? resolvedIds.filter(rid => rid !== id)
      : [...resolvedIds, id];

    setResolvedIds(newResolved);
    localStorage.setItem(`resolved_feedback_${businessId}`, JSON.stringify(newResolved));
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === 'all') return true;
      if (filter === 'negative') return item.rating <= 2;
      if (filter === 'neutral') return item.rating === 3;
      if (filter === 'positive') return item.rating >= 4;
      if (filter === 'needs_response') return item.status === 'open' && item.type === 'feedback';
      return true;
    });
  }, [items, filter]);

  return (
    <div className="premium-card p-0 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900">Feedback Inbox</h2>
          <Link href="/feedback" className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline">
            View All Activity →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-100">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="text-2xl">📥</span>
            </div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Clear for now</p>
            <p className="text-xs text-slate-400 font-medium max-w-[180px] mx-auto">No feedback matches your current filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEvent = item.type === 'event';
            const isResolved = item.status === 'resolved';

            return (
              <div key={item.id} className={`p-6 transition-all group hover:bg-slate-50/50 ${isResolved ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100 ${isEvent ? 'bg-blue-50 text-blue-600' :
                        item.rating >= 4 ? 'bg-emerald-50 text-emerald-600' :
                          item.rating <= 2 ? 'bg-rose-500 text-white border-none shadow-lg shadow-rose-200 animate-pulse' :
                            'bg-rose-50 text-rose-600'
                      }`}>
                      {isEvent ? '🚀' : item.rating >= 4 ? '⭐️' : '⚠️'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 truncate max-w-[140px] flex items-center gap-2">
                        {isEvent ? 'Verified Redirect' : (item.name || 'Anonymous')}
                        {!isEvent && item.rating <= 2 && !isResolved && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!isEvent && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${item.rating >= 4 ? 'bg-emerald-100 text-emerald-700' :
                        item.rating === 3 ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-600 text-white shadow-sm'
                      }`}>
                      {item.rating} Stars
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic mb-4">
                  {isEvent ? 'Customer was successfully routed to your Google Profile to leave a public review.' : `"${item.comment || 'No comment provided'}"`}
                </p>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isEvent && (
                    <>
                      <button
                        onClick={() => window.location.href = `mailto:${item.email}?subject=Feedback regarding your experience`}
                        className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all"
                      >
                        Reply
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
                        {isResolved ? 'Re-open' : 'Resolve'}
                      </button>
                    </>
                  )}
                  {isEvent && (
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                      Verified Completion
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
