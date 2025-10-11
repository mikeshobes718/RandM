"use client";
import { useEffect, useMemo, useState } from 'react';
import { formatPhone } from '@/lib/phone';

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
  archived?: boolean;
};

export default function FeedbackPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4+' | '3+' | '1-2'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [dateRange, setDateRange] = useState<'all' | '7' | '30' | '90'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    const headers: HeadersInit = {};
    const idToken = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }
    fetch('/api/feedback/list', { cache: 'no-store', credentials: 'include', headers })
      .then(r => {
        if (r.ok) return r.json();
        if (r.status === 401) {
          console.warn('Authentication required for feedback');
          return { items: [] };
        }
        return Promise.reject(new Error(String(r.status)));
      })
      .then((j) => {
        setItems(Array.isArray(j.items) ? j.items.map((i: any) => ({...i, archived: false})) : []);
        setError(null);
      })
      .catch((e) => {
        console.error('Feedback load error:', e);
        setError('Failed to load feedback. Please try refreshing the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let x = items.slice();
    
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
    
    // Search filter (name, email, phone, comment)
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
  }, [items, q, ratingFilter, sortBy, dateRange]);

  function exportCsv() {
    const rows = [
      ['created_at','rating','name','email','phone','comment','marketing_consent'],
      ...filtered.map(i => [
        i.created_at,
        String(i.rating),
        i.name||'',
        i.email||'',
        formatPhone(i.phone)||'',
        (i.comment||'').replace(/\n/g,' '),
        i.marketing_consent ? 'yes' : 'no'
      ])
    ];
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'feedback.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const archiveItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? {...i, archived: !i.archived} : i));
  };

  // Calculate summary stats
  const avgRating = filtered.length > 0 
    ? (filtered.reduce((sum, i) => sum + i.rating, 0) / filtered.length).toFixed(1)
    : '0.0';
  const followUpCount = filtered.filter(i => i.marketing_consent && !i.archived).length;

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Private Feedback</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm sm:text-base text-gray-600">Responses from your review landing page</p>
                <button
                  onClick={() => alert('Private Feedback:\n\nThis page shows feedback submitted via your review landing page. Customers with low ratings (1-3 stars) can leave private feedback that only your team sees. Use this to address issues before they become public reviews.\n\nFollow-up Rules:\n- Follow-up permitted: Customer opted in to receive a reply\n- No follow-up: Customer declined contact\n\nExport CSV includes all visible feedback based on your current filters.')}
                  className="text-gray-400 hover:text-gray-600 transition"
                  title="Learn more about private feedback"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{avgRating}</div>
                  <div className="text-xs text-gray-600">Avg Rating</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{followUpCount}</div>
                  <div className="text-xs text-gray-600">Follow-ups Pending</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{filtered.length}</div>
                  <div className="text-xs text-gray-600">Total Responses</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <input 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" 
                placeholder="Search name, email, phone, or comment..." 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
              />
            </div>
            
            {/* Rating Filter */}
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" 
              value={ratingFilter} 
              onChange={e=>setRatingFilter(e.target.value as any)}
            >
              <option value="all">All ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
              <option value="4+">⭐⭐⭐⭐+ (4+ stars)</option>
              <option value="3+">⭐⭐⭐+ (3+ stars)</option>
              <option value="1-2">⭐⭐ (1-2 stars)</option>
            </select>
            
            {/* Date Range */}
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" 
              value={dateRange} 
              onChange={e=>setDateRange(e.target.value as any)}
            >
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            
            {/* Sort */}
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" 
              value={sortBy} 
              onChange={e=>setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>
          
          {/* Export Button */}
          <div className="mt-3 flex justify-end">
            <button 
              onClick={exportCsv} 
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV ({filtered.length})
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-40" />}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        {!loading && !error && (
          <div className="space-y-3">
            {paginatedItems.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">No feedback found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or share your review landing link to start collecting feedback.</p>
              </div>
            ) : (
              <>
                {paginatedItems.map((f, idx) => {
                  const isExpanded = expandedIds.has(f.id);
                  const commentTruncated = (f.comment?.length || 0) > 150;
                  const displayComment = isExpanded || !commentTruncated 
                    ? f.comment 
                    : f.comment?.slice(0, 150) + '...';

                  return (
                    <div
                      key={f.id}
                      className={`rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } ${f.archived ? 'opacity-60' : ''}`}
                    >
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Star Rating */}
                          <div className={`flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold ${
                            f.rating >= 4 
                              ? 'bg-emerald-500/10 text-emerald-700' 
                              : f.rating >= 3 
                              ? 'bg-amber-500/10 text-amber-700'
                              : 'bg-red-500/10 text-red-700'
                          }`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                            </svg>
                            {f.rating}
                          </div>
                          
                          {/* Contact Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-sm font-semibold text-gray-900">{f.name || 'Anonymous'}</span>
                              <span className="text-xs text-gray-500 truncate">
                                {[f.email, f.phone && formatPhone(f.phone)].filter(Boolean).join(' • ') || '—'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {new Date(f.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Follow-up Status */}
                        {f.marketing_consent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Follow-up permitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-600">
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            No follow-up
                          </span>
                        )}
                      </div>
                      
                      {/* Comment */}
                      {f.comment && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {displayComment}
                          </p>
                          {commentTruncated && (
                            <button 
                              onClick={() => toggleExpanded(f.id)}
                              className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
                            >
                              {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        {f.marketing_consent && f.email && (
                          <a
                            href={`mailto:${f.email}?subject=Following up on your feedback`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Send Reply
                          </a>
                        )}
                        <button
                          onClick={() => archiveItem(f.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          {f.archived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                          onClick={() => alert('Tagging coming soon')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Add Tag
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{' '}
                      <span className="font-medium">{filtered.length}</span> results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
