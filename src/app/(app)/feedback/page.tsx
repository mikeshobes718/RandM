"use client";
import { useEffect, useMemo, useState, Suspense } from 'react';
import { formatPhone } from '@/lib/phone';
import Link from 'next/link';
import InfoTip from '@/components/InfoTip';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const handleCopyLink = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.reviewsandmarketing.com';
    const url = `${origin}/r/${business?.id}?source=followup`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    const initAuth = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { app } = await import('@/lib/firebaseClient');
      const auth = getAuth(app);
      
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        try {
          const idToken = user ? await user.getIdToken() : localStorage.getItem('idToken');
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
      });
    };
    
    initAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant text-sm font-medium tracking-widest uppercase">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Customer Feedback</h1>
            <InfoTip text="Private feedback, contact captures, and Google review events tied to your business. Archive items you have handled." />
          </div>
          <p className="text-on-surface-variant text-sm font-medium mt-1 flex items-center gap-2">
            Connected to {business?.name}
            {business?.address && (
              <span className="text-on-surface-variant/60 font-normal border-l border-outline-variant/30 pl-2 ml-1 hidden sm:inline">
                {business.address.split(',')[0]}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`h-10 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${showArchived ? 'bg-surface-container-low border-outline-variant/40 text-on-surface' : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-lowest'}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button 
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-lowest transition-all disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Avg Rating</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-extrabold text-primary">{avgRating}</p>
            <span className="material-symbols-outlined text-amber-400 text-lg mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{items.length}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Filtered</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{filtered.length}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">5-Star Rate</p>
          <p className="text-2xl font-extrabold text-secondary mt-1">{items.length > 0 ? `${((items.filter(i => i.rating === 5).length / items.length) * 100).toFixed(0)}%` : '0%'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm p-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Search</label>
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Name, email..." 
              className="h-10 w-full rounded-lg bg-surface-container-low border-none px-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Source</label>
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value as any)}
              className="h-10 w-full rounded-lg bg-surface-container-low border-none px-3 text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Sources</option>
              <option value="google">Google Reviews</option>
              <option value="feedback">Private Feedback</option>
              <option value="contact">5-Star Contacts</option>
              <option value="event">Anonymous Redirects</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Rating</label>
            <select 
              value={ratingFilter} 
              onChange={e => setRatingFilter(e.target.value as any)}
              className="h-10 w-full rounded-lg bg-surface-container-low border-none px-3 text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4+">4+ Stars</option>
              <option value="3+">3+ Stars</option>
              <option value="1-2">1-2 Stars</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Timeframe</label>
            <select 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value as any)}
              className="h-10 w-full rounded-lg bg-surface-container-low border-none px-3 text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Sort</label>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="h-10 w-full rounded-lg bg-surface-container-low border-none px-3 text-xs text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
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
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {paginatedItems.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-4 block">inbox</span>
            <h2 className="text-lg font-bold text-on-surface mb-1">No feedback found</h2>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Try adjusting your filters or share your review link to get more responses.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm overflow-hidden divide-y divide-outline-variant/10">
            {paginatedItems.map((f) => {
              const isEvent = f.type === 'event';
              
              return (
                <div key={f.id} className={`p-5 hover:bg-surface-container-low/30 transition-colors ${isEvent ? 'bg-surface/50' : ''}`}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        {!isEvent && (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            f.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : 
                            f.rating === 3 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {f.rating}<span className="material-symbols-outlined text-xs align-middle ml-0.5" style={{ fontVariationSettings: "'FILL' 1", fontSize: '12px' }}>star</span>
                          </span>
                        )}
                        
                        {isEvent ? (
                          <span className="font-semibold text-sm text-on-surface-variant">Verified Google Redirect</span>
                        ) : (
                          <span className="font-semibold text-sm text-on-surface">{f.name || (f.type === 'google' ? 'Google Reviewer' : 'Anonymous Customer')}</span>
                        )}
                        
                        {f.type === 'google' && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider rounded-full">Google</span>}
                        {f.type === 'feedback' && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold uppercase tracking-wider rounded-full">Private</span>}
                        {f.type === 'contact' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider rounded-full">Lead</span>}
                        {isEvent && <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant text-[9px] font-bold uppercase tracking-wider rounded-full">System</span>}

                        <span className="text-xs text-on-surface-variant/60 font-medium ml-auto flex-shrink-0">
                          {new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {isEvent ? (
                        <p className="text-xs text-on-surface-variant/60">Customer routed to Google Business Profile via QR code.</p>
                      ) : (
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            {f.comment ? `"${f.comment}"` : 'No comment provided.'}
                        </p>
                      )}
                          
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2.5">
                        {f.email && (
                          <a href={`mailto:${f.email}?subject=Follow-up from ${business?.name || 'our business'}`} className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">mail</span>{f.email}
                          </a>
                        )}
                        {f.phone && (
                          <a href={`sms:${f.phone}`} className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">sms</span>{formatPhone(f.phone)}
                          </a>
                        )}
                        {!isEvent && f.marketing_consent && (
                          <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Follow-up OK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-end flex-shrink-0">
                      {f.type === 'google' ? (
                        <a href={business?.review_link || `https://www.google.com/search?q=${encodeURIComponent(business?.name || '')}+reviews`} target="_blank" rel="noopener noreferrer"
                          className="h-9 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5">
                          View on Google <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      ) : isEvent ? (
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider px-3 py-1.5 bg-blue-50 rounded-lg">Verified</span>
                      ) : (
                        <div className="flex gap-2">
                          {f.email && (
                            <a href={`mailto:${f.email}?subject=Follow-up from ${business?.name || 'our business'}`}
                              className="h-9 px-3 bg-inverse-surface hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">mail</span>Email
                            </a>
                          )}
                          {!isEvent && f.type !== 'google' && (
                            <button onClick={(e) => handleCopyLink(e, f.id)}
                              className="h-9 px-3 bg-primary-fixed text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 hover:bg-primary-fixed-dim">
                              {copiedId === f.id ? 'Copied!' : 'Copy Link'}
                            </button>
                          )}
                          <button onClick={() => toggleArchive(f.id, f.archived)}
                            className="h-9 px-3 border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-low transition-all">
                            {f.archived ? 'Restore' : 'Archive'}
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
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
            className="h-9 px-5 border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50">
            Previous
          </button>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
            className="h-9 px-5 border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50">
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
    let unsubscribe: () => void;
    
    const initAuth = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { app } = await import('@/lib/firebaseClient');
      const auth = getAuth(app);
      
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          const tok = user ? await user.getIdToken() : localStorage.getItem('idToken');
          const res = await fetch('/api/businesses/me', { 
              headers: tok ? { Authorization: `Bearer ${tok}` } : {},
              cache: 'no-store' 
          });
          const d = await res.json();
          setBusiness(d.business);
        } catch (e) {}
      });
    };
    
    initAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <FeedbackContent business={business} />
      </Suspense>
    </main>
  );
}
