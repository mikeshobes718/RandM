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

  const suggestions = ['Table 1', 'Front Desk', 'Lobby', 'Flyer', 'Menu'];

  const quickAdd = (name: string) => {
    setNewName(name);
  };

  return (
    <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed group relative min-h-[400px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900">Campaign Tracking</h2>
        <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-2 py-1 rounded border border-brand/10 shadow-sm">Pro Feature</span>
      </div>
      <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
        Create unique QR codes for different areas of your business to see exactly which location drives the most reviews.
      </p>

      {/* Tooltip */}
      <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
        <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
          Segment your data. Create unique codes for every table, staff member, or promotional flyer.
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={createSource} className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white shadow-sm">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Create New Tracking Source</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Table 1, Front Desk..."
                className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all shadow-inner"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="primary-button !h-11 px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-transform"
              >
                {loading ? '...' : 'Add Code'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Suggestions:</span>
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => quickAdd(s)}
                className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg hover:border-brand/50 hover:text-brand transition-all shadow-sm active:bg-slate-50"
              >
                + {s}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Active Tracking Codes ({sources.length})</label>
          {sources.length === 0 ? (
            <div className="text-center py-12 bg-white/30 border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-xs text-slate-400 font-medium">No custom codes created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sources.map((source) => {
                const sourceUrl = `${landingUrl}?source=${source.slug}`;
                return (
                  <div key={source.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-brand/30 hover:shadow-md group/item">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-xl shrink-0 group-hover/item:bg-brand/5 group-hover/item:border-brand/10 transition-colors">
                      <img
                        src={`/api/qr?data=${encodeURIComponent(sourceUrl)}&format=png&scale=4`}
                        alt="QR"
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-700 truncate">{source.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">{source.slug}</div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/qr?data=${encodeURIComponent(sourceUrl)}&format=png&scale=12`}
                        download={`${source.slug}-qr.png`}
                        className="secondary-button !h-8 !px-4 !text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-white"
                      >
                        PNG
                      </a>
                      <button
                        onClick={() => deleteSource(source.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

