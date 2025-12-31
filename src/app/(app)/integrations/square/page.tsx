"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

type SquareStatus = {
  connected: boolean;
  businessId?: string | null;
  sandbox?: boolean;
  defaultLocationId?: string | null;
  merchantId?: string | null;
  lastBackfillAt?: string | null;
  isEnabled?: boolean;
} | null;

type BackfillJob = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  sent_count: number | null;
  total_customers: number | null;
  error_message: string | null;
  created_at: string;
};

function SquareIntegrationInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<SquareStatus>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [sandbox, setSandbox] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string>('loading');
  const [redirecting, setRedirecting] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [jobs, setJobs] = useState<BackfillJob[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [maxCustomers, setMaxCustomers] = useState(100);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isPro = useMemo(() => {
    if (!planStatus || planStatus === 'loading') return false;
    const normalized = planStatus.toLowerCase();
    return normalized === 'active' || normalized === 'trialing';
  }, [planStatus]);

  useEffect(() => {
    if (!searchParams) return;
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }
    
    if (connected && status?.connected) {
      setMessage('Square account connected successfully.');
      // Clear the URL param to avoid confusion
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('connected');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, status]);

  const loadStats = async () => {
    try {
      const tok = localStorage.getItem('idToken');
      const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
      const res = await fetch('/api/integrations/square/backfill', { headers });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setCustomerCount(data.totalCustomers || 0);
      }
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // If returning from OAuth, wait a moment for DB write to complete
        const isConnecting = searchParams?.get('connected') === '1';
        if (isConnecting) {
          await new Promise(r => setTimeout(r, 1000));
        }

        // Check Pro status
        let proAllowed = false;
        const planHeaders: Record<string, string> = {};
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) planHeaders.Authorization = `Bearer ${tok}`;
        } catch {}
        
        const planRes = await fetch('/api/plan/status', { cache: 'no-store', credentials: 'include', headers: planHeaders });
        if (planRes.ok) {
          const plan = await planRes.json().catch(() => null) as { status?: string } | null;
          const statusValue = typeof plan?.status === 'string' ? plan.status : 'none';
          if (!cancelled) setPlanStatus(statusValue);
          const normalized = statusValue.toLowerCase();
          proAllowed = normalized === 'active' || normalized === 'trialing';
        }

        if (!proAllowed) {
          if (!cancelled) {
            setStatus(null);
            setError(null);
            setRedirecting(true);
          }
          if (typeof window !== 'undefined') {
            window.location.replace(`/pricing?welcome=1&from=square`);
          }
          return;
        }

        // Get headers for API calls
        const headers: Record<string, string> = {};
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) headers.Authorization = `Bearer ${tok}`;
        } catch {}

        // First, get business info from dashboard summary
        try {
          const dashRes = await fetch('/api/dashboard/summary', { 
            cache: 'no-store', 
            credentials: 'include', 
            headers 
          });
          if (dashRes.ok) {
            const dashData = await dashRes.json();
            if (!cancelled && dashData?.business?.id) {
              setBusinessId(String(dashData.business.id));
            }
          }
        } catch (e) {
          console.error('Failed to fetch business info:', e);
        }
        
        // Then get Square connection status
        const statusRes = await fetch('/api/integrations/square/connect', { 
          cache: 'no-store', 
          credentials: 'include', 
          headers 
        });
        
        if (statusRes.ok) {
          const s = await statusRes.json();
          if (!cancelled) {
            setStatus(s as SquareStatus);
            if (s.sandbox != null) setSandbox(Boolean(s.sandbox));
            // If connected, use the businessId from the connection
            if (s.businessId) setBusinessId(String(s.businessId));
          }
        } else if (statusRes.status === 401) {
          // Auth issue - don't show error, just show disconnected state
          if (!cancelled) setStatus({ connected: false });
        } else if (statusRes.status === 403) {
          // Not Pro - redirect handled above
          if (!cancelled) setStatus({ connected: false });
        } else {
          // Some other error
          const errorText = await statusRes.text().catch(() => 'Unknown error');
          console.error('Square connect status error:', statusRes.status, errorText);
          if (!cancelled) setStatus({ connected: false });
        }

        await loadStats();

      } catch (err) {
        console.error('Square integration load error:', err);
        // Don't show error to user for load failures - just show disconnected state
        if (!cancelled) {
          setStatus({ connected: false });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [searchParams]);

  async function startOAuth(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!isPro) {
      setError('Square automations require a Pro subscription.');
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const tok = localStorage.getItem('idToken');
        if (tok) headers.Authorization = `Bearer ${tok}`;
      } catch {}
      const res = await fetch('/api/integrations/square/oauth/start', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ sandbox, businessId }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText || 'Unable to start Square OAuth'));
      const data = await res.json() as { url?: string };
      if (!data?.url) throw new Error('Missing Square authorize URL');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Square OAuth start failed');
    } finally {
      setSaving(false);
    }
  }

  async function disconnectSquare() {
    if (!isPro) {
      setError('Square automations require a Pro subscription.');
      return;
    }
    try {
      setDisconnecting(true);
      setMessage(null);
      setError(null);
      const headers: Record<string, string> = { };
      try {
        const tok = localStorage.getItem('idToken');
        if (tok) headers.Authorization = `Bearer ${tok}`;
      } catch {}
      const res = await fetch('/api/integrations/square/connect', {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText || 'Disconnect failed'));
      setStatus({ connected: false });
      setMessage('Square connection removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setDisconnecting(false);
    }
  }

  async function runBackfill() {
    if (!status?.connected) return;
    try {
      setIsBackfilling(true);
      setError(null);
      setMessage(null);
      const tok = localStorage.getItem('idToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;
      
      const res = await fetch('/api/integrations/square/backfill', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          maxCustomers,
          dryRun: false
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessage(`Backfill complete: Sent ${data.sent} requests, skipped ${data.skipped}.`);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backfill failed');
    } finally {
      setIsBackfilling(false);
    }
  }

  async function toggleMonitoring(enabled: boolean) {
    if (!status?.connected) return;
    try {
      setToggling(true);
      setError(null);
      const tok = localStorage.getItem('idToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;

      const res = await fetch('/api/integrations/square/connect', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isEnabled: enabled })
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus(prev => prev ? { ...prev, isEnabled: enabled } : null);
      setMessage(`Real-time monitoring ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update monitoring');
    } finally {
      setToggling(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Square Integration</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Automate review requests for every Square transaction.</p>
          </div>
          <Link href="/dashboard" className="secondary-button !h-10 text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
            <p className="text-sm font-bold text-muted animate-pulse">
              Loading Square status...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Settings & Status */}
            <div className="lg:col-span-7 space-y-6">
              {message && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {message}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Connection Card */}
              <section className="premium-card p-8 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                    </svg>
                  </div>
                  {status?.connected ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                      Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                      Disconnected
                    </span>
                  )}
                </div>

                {!status?.connected ? (
                  <form onSubmit={startOAuth} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-2">Connect Square Account</h2>
                      <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        Link your Square account to automatically import customers and send review requests after every sale.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Business ID</label>
                        <input
                          value={businessId}
                          onChange={(e) => setBusinessId(e.target.value)}
                          placeholder="Your Business ID"
                          required
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={sandbox}
                            onChange={(e) => setSandbox(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition ${sandbox ? 'bg-brand' : 'bg-slate-200'}`}></div>
                          <div className={`absolute left-1 w-4 h-4 bg-white rounded-full shadow-sm transition transform ${sandbox ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">
                          Use Sandbox Mode (Developer)
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="primary-button w-full !h-12 text-sm font-bold"
                    >
                      {saving ? 'Connecting...' : 'Continue to Square'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Merchant ID</div>
                        <div className="text-sm font-mono text-slate-700">{status?.merchantId || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</div>
                        <div className="text-sm font-mono text-slate-700">{status?.defaultLocationId || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Environment</div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{status?.sandbox ? 'Sandbox' : 'Production'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Backfill</div>
                        <div className="text-sm font-bold text-slate-700">
                          {status?.lastBackfillAt ? new Date(status.lastBackfillAt).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={disconnectSquare}
                      disabled={disconnecting}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition disabled:opacity-50"
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Webhook Configuration Instructions */}
            {status?.connected && (
              <section className="premium-card p-8 rounded-3xl bg-slate-50 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Webhook Configuration</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  To enable live automation, you must configure a webhook in your Square Developer Dashboard. This allows us to receive notifications whenever a payment is completed.
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target URL</div>
                    <div className="text-xs font-mono bg-white p-2 border border-slate-200 rounded-lg truncate select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/square` : 'https://www.reviewsandmarketing.com/api/webhooks/square'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Events to Subscribe</div>
                    <div className="text-xs font-bold text-slate-700">payment.created, payment.updated</div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Once configured, copy the "Signature Key" from Square and add it to your environment variables as <code className="bg-slate-100 px-1 rounded">SQUARE_WEBHOOK_SIGNATURE_KEY</code>.
                  </p>
                </div>
              </section>
            )}

            {/* Backfill Actions */}
              {status?.connected && (
                <section className="premium-card p-8 rounded-3xl">
                  <h2 className="text-xl font-bold mb-2">Backfill Customers</h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Import your existing Square customers and send them a review request. We'll automatically skip anyone who has received a request recently.
                  </p>

                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Import Limit</label>
                      <select 
                        value={maxCustomers}
                        onChange={(e) => setMaxCustomers(Number(e.target.value))}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                      >
                        <option value={50}>Latest 50 Customers</option>
                        <option value={100}>Latest 100 Customers</option>
                        <option value={200}>Latest 200 Customers</option>
                        <option value={500}>Latest 500 Customers</option>
                      </select>
                    </div>
                    <button
                      onClick={runBackfill}
                      disabled={isBackfilling}
                      className="primary-button !h-11 px-8 text-sm font-bold whitespace-nowrap"
                    >
                      {isBackfilling ? 'Running...' : 'Run Backfill'}
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: History & Automation */}
            <div className="lg:col-span-5 space-y-6">
              {/* Customer Database Summary */}
              {status?.connected && (
                <section className="premium-card p-6 rounded-3xl bg-emerald-50/50 border-emerald-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-emerald-900">Customer Database</h2>
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-emerald-700">{customerCount ?? '—'}</span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Total Customers</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 leading-relaxed font-medium">
                    Imported from Square and other sources. These customers are eligible for automated review requests.
                  </p>
                </section>
              )}

              {/* Automation Status */}
              <section className="premium-card p-6 rounded-3xl bg-brand/5 border-dashed relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Live Automation</h2>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${status?.connected && status?.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {status?.connected && (
                      <span className={`text-[10px] font-black uppercase tracking-widest ${status?.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {status?.isEnabled ? 'Active' : 'Paused'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {status?.connected 
                    ? status?.isEnabled 
                      ? "Automatic review requests are ACTIVE. We'll send a request to every new customer who completes a transaction."
                      : "Automatic review requests are PAUSED. Webhooks will be ignored until you re-enable monitoring."
                    : "Connect your Square account to enable live review request automation."
                  }
                </p>

                {status?.connected && (
                  <div className="pt-4 border-t border-brand/10">
                    <button
                      onClick={() => toggleMonitoring(!status.isEnabled)}
                      disabled={toggling}
                      className={`w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        status.isEnabled 
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                      }`}
                    >
                      {toggling ? '...' : status.isEnabled ? 'Pause Monitoring' : 'Enable Monitoring'}
                    </button>
                  </div>
                )}
              </section>

              {/* Job History */}
              <section className="premium-card p-6 rounded-3xl">
                <h2 className="text-sm font-bold text-slate-900 mb-6">Recent Activity</h2>
                {jobs.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent jobs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                            job.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {job.status === 'completed' ? `Sent ${job.sent_count} / ${job.total_customers} requests` : 
                           job.status === 'failed' ? job.error_message : 'In progress...'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Help Card */}
              <div className="p-6 bg-slate-900 rounded-3xl text-white">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4">How it works</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <p className="text-[10px] leading-relaxed text-slate-400">Authorize connection between Square and Reviews & Marketing.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                    <p className="text-[10px] leading-relaxed text-slate-400">Optionally run a backfill to capture your most recent customers.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p className="text-[10px] leading-relaxed text-slate-400">Relax. Every future transaction automatically triggers a review request.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SquareIntegrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div></div>}>
      <SquareIntegrationInner />
    </Suspense>
  );
}
