"use client";
import { useState, useEffect } from 'react';
import { clientAuth } from '@/lib/firebaseClient';

type ReviewSource = {
  id: string;
  name: string;
  slug: string;
  scans?: number;
};

type Campaign = {
  name: string;
  sent: number;
  clicks: number;
  date: string;
};

interface Props {
  businessId: string;
  landingUrl: string;
  rates?: { delivered: number; click: number; optOut: number };
  recentCampaigns?: (Campaign & { id?: string })[];
}

export default function MultipleQrManager({ businessId, landingUrl, rates, recentCampaigns = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'qr' | 'campaigns'>('qr');
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = async () => {
    if (!businessId) return;
    setFetching(true);
    
    try {
      // Wait for user to be available
      let user = clientAuth.currentUser;
      if (!user) {
        // Poll for a second if not immediately available
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          user = clientAuth.currentUser;
          if (user) break;
        }
      }

      if (!user) {
        console.warn('[MultipleQrManager] No user found after polling');
        setFetching(false);
        return;
      }

      const tok = await user.getIdToken(true);
      const res = await fetch(`/api/review-sources/list?businessId=${businessId}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[FETCH] Sources from API:', data.sources);
        setSources(data.sources || []);
      } else {
        console.error('[MultipleQrManager] List API failed:', res.status);
      }
    } catch (e) {
      console.error('[MultipleQrManager] Fetch error:', e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [businessId]);

  const createSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const user = clientAuth.currentUser;
      if (!user) {
        setError('Your session has timed out. Please refresh.');
        setLoading(false);
        return;
      }
      const tok = await user.getIdToken(true);
      const res = await fetch('/api/review-sources/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}` 
        },
        body: JSON.stringify({ businessId, name: newName.trim() })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.source) {
        setNewName('');
        console.log('[CREATE] Source created successfully:', data.source);
        
        // Immediately add to local state for instant feedback
        const newSource = { ...data.source, scans: 0 };
        setSources(prev => {
          const filtered = prev.filter(s => s.id !== newSource.id);
          const updated = [newSource, ...filtered];
          console.log('[CREATE] Updated local state. Total sources:', updated.length);
          return updated;
        });
        
        // REMOVED redundant re-fetch that causes "disappearance" due to DB lag
        // The CREATE API already returns the full source object.
        console.log('[CREATE] Skipping redundant re-fetch to maintain local state stability.');
      } else {
        console.error('[CREATE] Failed to create source:', data);
        setError(data.message || data.error || 'Failed to create tracking code. Please try again.');
      }
    } catch (e: any) {
      console.error('[MultipleQrManager] Create error:', e);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Delete this QR source?')) return;
    try {
      const user = clientAuth.currentUser;
      if (!user) return;
      const tok = await user.getIdToken(true);
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

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign record?')) return;
    try {
      const user = clientAuth.currentUser;
      if (!user) return;
      const tok = await user.getIdToken(true);
      const res = await fetch(`/api/campaigns/list?id=${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (res.ok) {
        // We need to trigger a refresh of the dashboard data
        window.location.reload();
      }
    } catch (e) {
      console.error('Error deleting campaign:', e);
    }
  };

  if (fetching) return <div className="animate-pulse h-20 bg-slate-50 rounded-xl" />;

  const suggestions = ['Table 1', 'Front Desk', 'Lobby', 'Flyer', 'Menu'];

  const quickAdd = (name: string) => {
    setNewName(name);
  };

  const [showExample, setShowExample] = useState(false);

  return (
    <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed group relative min-h-[400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campaign Tracking</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Monitor all your inbound and outbound review traffic.
          </p>
        </div>
        <div className="flex bg-white/50 p-1 rounded-xl border border-white shadow-sm self-start">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'qr' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            QR Sources
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'campaigns' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Outbound
          </button>
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
        <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
          {activeTab === 'qr' 
            ? "Segment your data. Create unique codes for every table, staff member, or promotional flyer."
            : "Track the performance of your SMS and Email campaigns in real-time."}
        </div>
      </div>

      {activeTab === 'qr' ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 relative group/example">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shadow-sm">💡</div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Best Placement</h3>
            </div>
            <p className="text-xs text-amber-800 font-bold leading-relaxed mb-6">
              Add to checkout counters, receipts, dining tables, business cards, mailers, and front doors to increase scans. You need to nicely design it and put it around your store. You can do it yourself or have us design it. Be creative!
            </p>
            
            <div className="p-5 bg-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Need a design?</p>
                  <p className="text-[9px] text-white/50 font-medium">We design custom printed QR assets for your store.</p>
                </div>
              </div>
              <button className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-95">
                Request Design
              </button>
            </div>
          </div>

          <form onSubmit={createSource} className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Create New Tracking Source</label>
                <div className="group/tip relative">
                  <span className="text-[10px] text-slate-300 cursor-help">ⓘ</span>
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-20 px-2 w-48">
                    <div className="bg-slate-900 text-white text-[8px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
                      Create a unique code for a specific table or staff member to track exactly where scans come from.
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2 space-y-3">
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
                        <div className="flex items-center gap-2">
                          <div className="text-[9px] text-slate-400 font-mono truncate">{source.slug}</div>
                          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                          <div className="text-[9px] font-black text-brand uppercase tracking-widest">{source.scans || 0} Scans</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/api/qr?data=${encodeURIComponent(sourceUrl)}&format=png&scale=12`}
                          download={`${source.slug}-qr.png`}
                          className="secondary-button !h-8 !px-4 !text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-white"
                        >
                          PNG
                        </a>
                        {source.slug !== 'main-qr' && (
                          <button
                            onClick={() => deleteSource(source.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-3xl shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">Real-time Performance</span>
              </div>
              <h3 className="text-xl font-black mb-4">Outbound Campaigns</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group/tip">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                    Total Outreach
                    <span className="text-white/20">ⓘ</span>
                  </p>
                  <p className="text-2xl font-black">
                    {recentCampaigns.reduce((acc, c) => acc + c.sent, 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-brand font-bold mt-1">Direct Outreach</p>
                  <div className="absolute inset-x-0 -bottom-10 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-20 px-2">
                    <div className="bg-slate-800 text-white text-[8px] py-1 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
                      Total SMS and Email requests sent across all campaigns.
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group/tip">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                    Avg. Click Rate
                    <span className="text-white/20">ⓘ</span>
                  </p>
                  <p className="text-2xl font-black">{rates?.click || 0}%</p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">Live Factual Data</p>
                  <div className="absolute inset-x-0 -bottom-10 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-20 px-2">
                    <div className="bg-slate-800 text-white text-[8px] py-1 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
                      The percentage of recipients who clicked your review link.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Top Performing Sources</label>
             {recentCampaigns.length === 0 ? (
               <div className="text-center py-8 bg-white/30 border-2 border-dashed border-slate-200 rounded-3xl">
                 <p className="text-xs text-slate-400 font-medium">No outbound campaigns sent yet.</p>
               </div>
             ) : (
               recentCampaigns.map((c, i) => {
                 const clickRate = c.sent > 0 ? Math.round((c.clicks / c.sent) * 100) : 0;
                 return (
                   <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/campaign">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white text-lg shadow-inner`}>
                          {c.name.toLowerCase().includes('sms') ? '📱' : '✉️'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{c.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{c.sent} Sent</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">{clickRate}%</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click Rate</p>
                        </div>
                        {(c as any).id && (
                          <button 
                            onClick={() => deleteCampaign((c as any).id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                            title="Delete campaign record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}
    </section>
  );
}
