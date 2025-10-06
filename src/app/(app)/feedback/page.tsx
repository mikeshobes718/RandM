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
};

export default function FeedbackPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);

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
        setItems(Array.isArray(j.items) ? j.items : []);
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
    if (minRating != null) x = x.filter(i => i.rating >= minRating);
    if (q.trim()) {
      const term = q.toLowerCase();
      x = x.filter(i => (i.comment || '').toLowerCase().includes(term) || (i.name || '').toLowerCase().includes(term) || (i.email || '').toLowerCase().includes(term));
    }
    return x;
  }, [items, q, minRating]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600">Private feedback collected from your review landing page.</p>
          </div>
          <div className="flex items-center gap-2">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Search name, email, comment" value={q} onChange={e=>setQ(e.target.value)} />
            <select className="border rounded-lg px-3 py-2 text-sm" value={minRating ?? ''} onChange={e=>setMinRating(e.target.value?Number(e.target.value):null)}>
              <option value="">All ratings</option>
              <option value="5">5 stars only</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
            </select>
            <button onClick={exportCsv} className="rounded-lg px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-sm">Export CSV</button>
          </div>
        </div>

        {loading && <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-40" />}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        {!loading && !error && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {filtered.length === 0 ? (
              <div className="text-gray-600">No feedback yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((f) => (
                  <li key={f.id} className="py-4 grid grid-cols-6 gap-3 items-start">
                    <div className="col-span-1"><span className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-white text-xs ${f.rating >= 5 ? 'bg-green-500' : f.rating >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}>{f.rating}</span></div>
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">{f.name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{f.email || ''}</div>
                      {f.phone && <div className="text-xs text-gray-500">{formatPhone(f.phone)}</div>}
                      {f.marketing_consent && <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Follow-up ok</div>}
                    </div>
                    <div className="col-span-2 text-sm text-gray-700 whitespace-pre-line">{f.comment || ''}</div>
                    <div className="col-span-1 text-xs text-gray-500 text-right">{new Date(f.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
