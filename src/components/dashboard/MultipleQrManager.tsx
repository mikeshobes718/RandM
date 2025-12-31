"use client";
import { useState, useEffect } from 'react';

type ReviewSource = {
  id: string;
  name: string;
  slug: string;
};

interface Props {
  businessId: string;
  landingUrl: string;
}

export default function MultipleQrManager({ businessId, landingUrl }: Props) {
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, [businessId]);

  const fetchSources = async () => {
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch(`/api/review-sources/list?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (e) {
      console.error('Error fetching sources:', e);
    } finally {
      setFetching(false);
    }
  };

  const createSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch('/api/review-sources/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}` 
        },
        body: JSON.stringify({ businessId, name: newName.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setSources([data.source, ...sources]);
        setNewName('');
      } else {
        const errText = await res.text();
        setError(errText || 'Failed to create source');
      }
    } catch (e) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Delete this QR source?')) return;
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch('/api/review-sources/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}` 
        },
        body: JSON.stringify({ businessId, sourceId: id })
      });
      if (res.ok) {
        setSources(sources.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error('Error deleting source:', e);
    }
  };

  if (fetching) return <div className="animate-pulse h-20 bg-slate-50 rounded-xl" />;

  return (
    <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Multiple QR Codes</h2>
          <p className="text-xs text-muted">Create custom links for tables, flyers, or staff to track performance.</p>
        </div>
        <span className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-1 rounded">Pro</span>
      </div>

      <form onSubmit={createSource} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Table 1, Front Desk, Flyer"
          className="flex-1 h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="primary-button !h-10 px-6 text-sm"
        >
          {loading ? '...' : 'Add Source'}
        </button>
      </form>

      {error && <p className="text-red-500 text-xs mb-4 font-bold">{error}</p>}

      <div className="space-y-4">
        {sources.length === 0 ? (
          <p className="text-xs text-muted italic text-center py-4">No custom sources yet. Create one to get started.</p>
        ) : (
          sources.map((source) => {
            const sourceUrl = `${landingUrl}?source=${source.slug}`;
            return (
              <div key={source.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-border/50 shadow-sm transition-all hover:border-brand/30">
                <div className="p-2 bg-white border border-border rounded-lg shrink-0">
                  <img
                    src={`/api/qr?data=${encodeURIComponent(sourceUrl)}&format=png&scale=4`}
                    alt="QR"
                    className="w-16 h-16"
                  />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="text-sm font-bold truncate">{source.name}</div>
                  <div className="text-[10px] text-muted font-mono truncate">{sourceUrl}</div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/qr?data=${encodeURIComponent(sourceUrl)}&format=png&scale=10`}
                    download={`${source.slug}-qr.png`}
                    className="secondary-button !h-8 !px-3 !text-[10px]"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => deleteSource(source.id)}
                    className="text-red-400 hover:text-red-600 p-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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

