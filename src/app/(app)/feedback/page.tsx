"use client";
import { useEffect, useMemo, useState, Suspense } from 'react';
import { formatPhone } from '@/lib/phone';
import { inputClass, primaryButtonClass, secondaryButtonClass, premiumCardClass } from '@/lib/styles';
import Link from 'next/link';

type Item = {
  id: string;
  business_id: string;
  rating: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  comment: string | null;
  marketing_consent: boolean | null;
  created_at: string;
  archived: boolean;
  type: 'feedback' | 'contact' | 'google' | 'event';
};

function FeedbackContent({ business }: { business: any }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4+' | '3+' | '1-2'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [dateRange, setDateRange] = useState<'all' | '7' | '30' | '90'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'feedback' | 'google' | 'contact' | 'event'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const idToken = localStorage.getItem('idToken');
      const headers: HeadersInit = idToken ? { Authorization: `Bearer ${idToken}` } : {};
      
      const res = await fetch(`/api/feedback/list?days=9999&limit=5000&t=${Date.now()}`, { 
        cache: 'no-store', 
        credentials: 'include', 
        headers 
      });
      
      if (res.ok) {
        const j = await res.json();
        setItems(Array.isArray(j.items) ? j.items : []);
        setError(null);
      } else {
        throw new Error('Failed to load feedback');
      }
    } catch (e) {
      setError('Failed to load feedback. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let x = items.slice();
    
    // Archive filter
    if (!showArchived) x = x.filter(i => !i.archived);
    else x = x.filter(i => i.archived);
    
    // Filter by type
    if (typeFilter !== 'all') {
      if (typeFilter === 'contact') x = x.filter(i => i.type === 'contact');
      else if (typeFilter === 'google') x = x.filter(i => i.type === 'google');
      else if (typeFilter === 'feedback') x = x.filter(i => i.type === 'feedback');
      else if (typeFilter === 'event') x = x.filter(i => i.type === 'event');
    }

    // Filter by rating
    if (ratingFilter === '5') x = x.filter(i => i.rating === 5);
    else if (ratingFilter === '4+') x = x.filter(i => i.rating >= 4);
    else if (ratingFilter === '3+') x = x.filter(i => i.rating >= 3);
    else if (ratingFilter === '1-2') x = x.filter(i => i.rating <= 2);
    
    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      x = x.filter(i => new Date(i.created_at) >= cutoff);
    }
    
    // Search filter
    if (q.trim()) {
      const term = q.toLowerCase();
      x = x.filter(i => 
        (i.comment || '').toLowerCase().includes(term) || 
        (i.name || '').toLowerCase().includes(term) || 
        (i.email || '').toLowerCase().includes(term) ||
        (i.phone || '').toLowerCase().includes(term)
      );
    }
    
    // Sort
    if (sortBy === 'newest') x.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') x.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'highest') x.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') x.sort((a, b) => a.rating - b.rating);
    
    return x;
  }, [items, q, ratingFilter, sortBy, dateRange, showArchived, typeFilter]);

  async function toggleArchive(id: string, currentStatus: boolean) {
    if (id.startsWith('google-')) return; // Cannot archive Google reviews yet
    // event types use UUIDs, so we can archive them if we have an archive table for events, 
    // but for now let's just allow it if the backend supports it.
    // The current backend /api/feedback/archive expects a feedback ID or contact capture ID.
    // Let's assume for now events aren't archivable unless we update the backend.
    try {
      const idToken = localStorage.getItem('idToken');
      const res = await fetch('/api/feedback/archive', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, archived: !currentStatus })
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, archived: !currentStatus } : i));
      }
    } catch (e) {
      console.error('Archive failed:', e);
    }
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Source', 'Rating', 'Name', 'Email', 'Phone', 'Comment', 'Marketing Consent'],
      ...filtered.map(i => [
        new Date(i.created_at).toLocaleString(),
        i.type.toUpperCase(),
        String(i.rating),
        i.name || 'Anonymous',
        i.email || '',
        formatPhone(i.phone) || '',
        (i.comment || '').replace(/\n/g, ' '),
        i.marketing_consent ? 'Yes' : 'No'
      ])
    ];
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${showArchived ? 'archived' : 'active'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const avgRating = items.length > 0 
    ? (items.reduce((sum, i) => sum + i.rating, 0) / items.length).toFixed(1)
    : '0.0';

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          {business?.google_photo_url && (
            <div className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-2xl flex-shrink-0 group relative cursor-pointer">
              <img src={business.google_photo_url} alt={business.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Customer Feedback</h1>
            <p className="text-muted text-sm font-medium flex items-center gap-2">
              Connected to {business?.name}
              {business?.address && (
                <span className="text-slate-400 font-normal border-l border-slate-200 pl-2 ml-1">
                  {business.address.split(',')[0]}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`secondary-button !h-10 px-4 text-xs ${showArchived ? 'bg-slate-100 border-slate-300' : ''}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button 
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="secondary-button !h-10 px-4 text-xs disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="premium-card p-6 rounded-2xl">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Average Feedback</div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-black">{avgRating}</div>
            <div className="flex mb-1.5 text-amber-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08-3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                </svg>
            </div>
          </div>
        </div>
        <div className="premium-card p-6 rounded-2xl">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Total Responses</div>
          <div className="text-4xl font-black">{items.length}</div>
        </div>
        <div className="premium-card p-6 rounded-2xl">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Filtered Count</div>
          <div className="text-4xl font-black">{filtered.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-6 rounded-3xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Search</label>
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Name, email..." 
              className={inputClass + " !h-10 !text-xs"} 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Source</label>
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value as any)}
              className={inputClass + " !h-10 !text-xs appearance-none"}
            >
              <option value="all">All Sources</option>
              <option value="google">Google Reviews</option>
              <option value="feedback">Private Feedback</option>
              <option value="contact">5-Star Contacts</option>
              <option value="event">Anonymous Redirects</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Rating</label>
            <select 
              value={ratingFilter} 
              onChange={e => setRatingFilter(e.target.value as any)}
              className={inputClass + " !h-10 !text-xs appearance-none"}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4+">4+ Stars</option>
              <option value="3+">3+ Stars</option>
              <option value="1-2">1-2 Stars</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Timeframe</label>
            <select 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value as any)}
              className={inputClass + " !h-10 !text-xs appearance-none"}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Sort</label>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className={inputClass + " !h-10 !text-xs appearance-none"}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {paginatedItems.length === 0 ? (
          <div className="premium-card p-20 rounded-[40px] text-center bg-accent/20 border-dashed">
            <div className="w-16 h-16 bg-white border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No feedback found</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">Try adjusting your filters or share your review link to get more responses.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {paginatedItems.map((f) => {
              const isEvent = f.type === 'event';
              
              return (
                <div key={f.id} className={premiumCardClass + ` p-6 rounded-3xl ${isEvent ? 'bg-slate-50/50 border-slate-100' : 'p-8'}`}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {!isEvent && (
                          <div className={`px-2.5 py-1 rounded-lg text-sm font-black flex items-center gap-1.5 ${
                            f.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : 
                            f.rating === 3 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {f.rating}★
                          </div>
                        )}
                        
                        {isEvent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.92s3.95-8.92 8.79-8.92c2.75 0 4.59 1.17 5.64 2.21l2.59-2.5c-1.66-1.55-3.82-2.5-8.23-2.5-6.62 0-12 5.38-12 12s5.38 12 12 12c6.92 0 11.52-4.87 11.52-11.72 0-.78-.08-1.38-.24-1.97h-11.28z"/></svg>
                            </div>
                            <h3 className="font-bold text-slate-500 italic">Verified Google Redirect</h3>
                          </div>
                        ) : (
                          <h3 className="font-bold text-lg">{f.name || (f.type === 'google' ? 'Google Reviewer' : 'Anonymous Customer')}</h3>
                        )}
                        
                        <div className="flex items-center gap-2 ml-4">
                          {f.type === 'google' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1">
                              Google Review
                            </span>
                          )}
                          {f.type === 'feedback' && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-purple-100 flex items-center gap-1">
                              Private Feedback
                            </span>
                          )}
                          {f.type === 'contact' && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1">
                              Contact Lead
                            </span>
                          )}
                          {isEvent && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                              System Log
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-muted font-medium ml-auto">
                          {new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="space-y-4">
                          {isEvent ? (
                            <p className="text-xs text-slate-400 font-medium">
                              A customer scanned your QR code and was successfully routed to your Google Business Profile to leave a review.
                            </p>
                          ) : (
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                "{f.comment || 'No specific comment provided.'}"
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                              {f.email && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                      {f.email}
                                  </div>
                              )}
                              {f.phone && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                      {formatPhone(f.phone)}
                                  </div>
                              )}
                              {!isEvent && (
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                    {f.marketing_consent ? (
                                        <span className="text-emerald-600 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Follow-up Permitted
                                        </span>
                                    ) : f.type !== 'google' && (
                                        <span className="text-slate-400">No Follow-up</span>
                                    )}
                                </div>
                              )}
                          </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-end md:w-40 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                      {f.type === 'google' ? (
                        <a 
                          href={business?.review_link || `https://www.google.com/search?q=${encodeURIComponent(business?.name || '')}+reviews`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={primaryButtonClass + " !h-10 !px-0 w-full text-xs flex items-center justify-center gap-2"}
                        >
                          View on Google
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                      ) : isEvent ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded">Verified</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full">
                          {f.email && (
                            <a 
                              href={`mailto:${f.email}?subject=Follow-up from ${business?.name || 'our business'}`}
                              className="px-4 h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Email
                            </a>
                          )}
                          {f.phone && (
                            <a 
                              href={`sms:${f.phone}`}
                              className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                              Text
                            </a>
                          )}
                          <button 
                            onClick={() => toggleArchive(f.id, f.archived)}
                            className={secondaryButtonClass + " !h-10 !px-0 w-full text-[10px]"}
                          >
                            {f.archived ? 'Unarchive' : 'Archive'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="secondary-button !h-10 !px-6 text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-muted uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="secondary-button !h-10 !px-6 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    const tok = localStorage.getItem('idToken');
    fetch('/api/businesses/me', { 
        headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        cache: 'no-store' 
    })
    .then(r => r.json())
    .then(d => setBusiness(d.business))
    .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <FeedbackContent business={business} />
      </Suspense>
    </main>
  );
}
