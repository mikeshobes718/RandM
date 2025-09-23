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
} | null;

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
  const isPro = useMemo(() => {
    if (!planStatus || planStatus === 'loading') return false;
    const normalized = planStatus.toLowerCase();
    return normalized === 'active' || normalized === 'trialing';
  }, [planStatus]);
  useEffect(() => {
    if (!searchParams) return;
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    if (connected) {
      setMessage('Square account connected successfully.');
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);

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
        } else if (!cancelled) {
          setPlanStatus('none');
        }

        if (!proAllowed) {
          if (!cancelled) {
            setStatus(null);
            setError(null);
          }
          return;
        }

        const headers: Record<string, string> = {};
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) headers.Authorization = `Bearer ${tok}`;
        } catch {}
        const res = await fetch('/api/dashboard/summary', { cache: 'no-store', credentials: 'include', headers });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            if (data?.business?.id) setBusinessId(String(data.business.id));
            if (data?.squareConnection) {
              const info = data.squareConnection as SquareStatus;
              setStatus(info);
              setSandbox(Boolean(info?.sandbox));
            }
          }
        }
        const statusRes = await fetch('/api/integrations/square/connect', { cache: 'no-store', credentials: 'include', headers });
        if (statusRes.status === 403) {
          if (!cancelled) {
            setStatus(null);
            setError('Square automations require a Pro subscription.');
          }
        } else if (statusRes.ok) {
          const s = await statusRes.json();
          if (!cancelled) {
            setStatus(s as SquareStatus);
            if ((s as SquareStatus)?.sandbox != null) setSandbox(Boolean((s as SquareStatus)?.sandbox));
            setError(null);
          }
        } else if (!cancelled) {
          const fallback = await statusRes.text().catch(() => 'Failed to load Square status');
          setError(fallback || 'Failed to load Square status');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load Square status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Square integration</h1>
            <p className="text-sm text-gray-600 mt-1">Connect your Square account to import past customers and send review requests.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 underline">Back to dashboard</Link>
        </div>

        {loading && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading Square status…</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loading && planStatus !== 'loading' && !isPro && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Square automations are a Pro feature</h2>
              <p className="text-sm text-amber-800 mt-1">
                Upgrade to the Pro plan to connect Square, sync customers, and trigger automated review requests.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/pricing?from=square" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-400/50 transition hover:-translate-y-0.5 hover:bg-amber-400">
                View Pro plans
              </Link>
              <Link href="/dashboard" className="text-sm font-semibold text-amber-700 underline">
                Back to dashboard
              </Link>
            </div>
          </section>
        )}

        {isPro && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900">Connection status</div>
            {status?.connected ? (
              <ul className="text-sm text-gray-600 space-y-1">
                <li><span className="font-medium text-gray-800">Mode:</span> {status?.sandbox ? 'Sandbox' : 'Production'}</li>
                {status?.defaultLocationId && (
                  <li><span className="font-medium text-gray-800">Default location:</span> {status.defaultLocationId}</li>
                )}
                {status?.merchantId && (
                  <li><span className="font-medium text-gray-800">Merchant ID:</span> {status.merchantId}</li>
                )}
                {status?.lastBackfillAt && (
                  <li><span className="font-medium text-gray-800">Last backfill:</span> {new Date(status.lastBackfillAt).toLocaleString()}</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Square isn’t connected yet.</p>
            )}
          </div>

          {status?.connected && (
            <button
              type="button"
              onClick={disconnectSquare}
              disabled={disconnecting}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect Square'}
            </button>
          )}
        </section>
        )}

        {isPro && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connect with Square</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click below to open the Square consent screen. After you approve access, we’ll return you here and finish linking your account.
            </p>
          </div>
          <form onSubmit={startOAuth} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Business ID
              <input
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sandbox}
                onChange={(e) => setSandbox(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Use Square sandbox environment (developers only)
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Redirecting…' : 'Connect with Square'}
            </button>
          </form>
        </section>
        )}

        {isPro && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3 text-sm text-gray-600">
          <div className="font-semibold text-gray-900">Need help?</div>
          <p>1. When prompted by Square, log in and grant Reviews & Marketing access to your customer data.</p>
          <p>2. After approving, you’ll return here with the connection confirmed automatically.</p>
          <p>3. Head back to the <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">dashboard</Link> to run a backfill.</p>
        </section>
        )}
      </div>
    </main>
  );
}

export default function SquareIntegrationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10"><div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8"><div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div></div></main>}>
      <SquareIntegrationInner />
    </Suspense>
  );
}
