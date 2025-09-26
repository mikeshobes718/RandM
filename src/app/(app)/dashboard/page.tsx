"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPhone } from '@/lib/phone';

type Business = {
  id: string | null;
  name: string;
  review_link?: string | null;
  google_maps_write_review_uri?: string | null;
  contact_phone?: string | null;
  google_rating?: number | null;
  google_place_id?: string | null;
};

type Stats = {
  reviewsThisMonth: number;
  shareLinkScans: number;
  averageRating: number | null;
};

type SquareConnectionInfo = {
  connected: boolean;
  sandbox?: boolean;
  lastBackfillAt?: string | null;
  defaultLocationId?: string | null;
  latestJob?: {
    id: string;
    status: string;
    createdAt: string;
    sentCount: number | null;
    totalCustomers: number | null;
  } | null;
} | null;

type BackfillResult = {
  jobId: string;
  totalConsidered: number;
  sent: number;
  skipped: number;
  dryRun: boolean;
  results: Array<{ email: string; status: 'sent' | 'skipped' | 'would_send'; reason?: string }>;
};

const SAMPLE_BACKFILL_PREVIEW: BackfillResult = {
  jobId: 'sample',
  totalConsidered: 24,
  sent: 18,
  skipped: 6,
  dryRun: true,
  results: [
    { email: 'olivia@samplebakery.com', status: 'would_send' },
    { email: 'marco@example.net', status: 'would_send' },
    { email: 'dana@contoso.org', status: 'skipped', reason: 'Contacted in last 90 days' },
    { email: 'info@freshgreenshop.com', status: 'would_send' },
    { email: 'samira@retreatspa.co', status: 'would_send' },
  ],
};

function toDateInputValue(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return utc.toISOString().slice(0, 10);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}

const BACKFILL_LOOKBACK_DAYS = 90;
const BACKFILL_DEFAULT_LIMIT = 200;

type FeedbackItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  comment: string | null;
  rating: number;
  marketing_consent: boolean | null;
  created_at: string;
};

export default function Dashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [planStatus, setPlanStatus] = useState<string>('loading');
  const [stats, setStats] = useState<Stats>({ reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [square, setSquare] = useState<SquareConnectionInfo>(null);
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [backfillStart, setBackfillStart] = useState<string>(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 30);
    return toDateInputValue(d);
  });
  const [backfillEnd, setBackfillEnd] = useState<string>(() => toDateInputValue(new Date()));
  const [backfillLimit, setBackfillLimit] = useState<number>(BACKFILL_DEFAULT_LIMIT);
  const [backfillDryRun, setBackfillDryRun] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillError, setBackfillError] = useState<string | null>(null);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);
  const [usingSampleBackfill, setUsingSampleBackfill] = useState(false);

  const loadRecentFeedback = async (headers: Record<string, string>) => {
    try {
      const res = await fetch('/api/feedback/list?limit=5', { cache: 'no-store', credentials: 'include', headers });
      if (!res.ok) return;
      const data = await res.json() as { items?: FeedbackItem[] };
      const items = Array.isArray(data.items)
        ? data.items.map((item) => ({
            ...item,
            phone: item.phone ? formatPhone(item.phone) : item.phone,
          }))
        : [];
      setRecentFeedback(items);
    } catch {}
  };

  useEffect(() => {
    // Do not redirect users from the dashboard based on email verification.
    // Verification is surfaced in-app via banner instead to avoid loops.
    (async () => {
      try {
        await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
      } catch {}
    })();
    (async () => {
      setLoading(true);
      try {
        const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        let r = await fetch('/api/dashboard/summary', { cache: 'no-store', credentials: 'include', headers });
        if (!r.ok) r = await fetch('/api/dashboard/summary', { cache: 'no-store', headers });
        if (!r.ok) throw new Error(await r.text().catch(()=>String(r.status)));
        const j = await r.json() as { business: Business | null; stats?: Stats | null; recentFeedback?: FeedbackItem[] | null; squareConnection?: SquareConnectionInfo };
        setBusiness(j.business);
        setStats(j.stats ?? { reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
        setRecentFeedback(Array.isArray(j.recentFeedback) ? j.recentFeedback : []);
        setSquare(j.squareConnection ?? null);
        if ((!j.recentFeedback || j.recentFeedback.length === 0) && j.business) {
          await loadRecentFeedback(headers);
        }
        setError(null);
        // If coming directly from onboarding and the record hasn't propagated yet, poll briefly
        if (!j.business) {
          const params = new URLSearchParams(window.location.search);
          const cameFromOnboarding = params.get('from') === 'onboarding';
          if (cameFromOnboarding) {
            setFinalizing(true);
            for (let i = 0; i < 12; i++) { // ~6s total
              await new Promise(res => setTimeout(res, 500));
              let r2 = await fetch('/api/dashboard/summary', { cache: 'no-store', credentials: 'include', headers });
              if (!r2.ok) r2 = await fetch('/api/dashboard/summary', { cache: 'no-store', headers });
              if (r2.ok) {
                const j2 = await r2.json() as { business: Business | null; stats?: Stats | null; recentFeedback?: FeedbackItem[] | null; squareConnection?: SquareConnectionInfo };
                if (j2.business) {
                  setBusiness(j2.business);
                  setStats(j2.stats ?? { reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
                  setRecentFeedback(Array.isArray(j2.recentFeedback) ? j2.recentFeedback : []);
                  setSquare(j2.squareConnection ?? null);
                  if (!j2.recentFeedback || j2.recentFeedback.length === 0) {
                    await loadRecentFeedback(headers);
                  }
                  break;
                }
              }
            }
            setFinalizing(false);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setBusiness(null);
        setStats({ reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
        setRecentFeedback([]);
        setSquare(null);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fallbackToEntitlements = async () => {
      try {
        const headers: Record<string, string> = {};
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) headers.Authorization = `Bearer ${tok}`;
        } catch {}
        const res = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include', headers });
        if (!res.ok) throw new Error('entitlements failed');
        const data = await res.json().catch(() => null) as { pro?: boolean } | null;
        if (!cancelled) setPlanStatus(data?.pro ? 'active' : 'none');
      } catch {
          if (!cancelled) setPlanStatus('none');
      }
    };

    const loadPlanStatus = async () => {
      try {
        const headers: Record<string, string> = {};
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) headers.Authorization = `Bearer ${tok}`;
        } catch {}
        let r = await fetch('/api/plan/status', { cache: 'no-store', credentials: 'include', headers });
        if (r.status === 401) {
          // likely still negotiating session; retry shortly
          if (!cancelled) {
            setTimeout(() => { if (!cancelled) void loadPlanStatus(); }, 800);
          }
          await fallbackToEntitlements();
          return;
        }
        if (!r.ok) r = await fetch('/api/plan/status', { cache: 'no-store', headers });
        if (!r.ok) {
          if (!cancelled) setTimeout(() => { if (!cancelled) void loadPlanStatus(); }, 1500);
          await fallbackToEntitlements();
          return;
        }
        const j = await r.json().catch(() => null) as { status?: string } | null;
        if (!cancelled) {
          setPlanStatus(typeof j?.status === 'string' ? j.status : 'none');
        }
      } catch {
        if (!cancelled) setTimeout(() => { if (!cancelled) void loadPlanStatus(); }, 1500);
        await fallbackToEntitlements();
      }
    };

    const handleRefresh = () => { void loadPlanStatus(); };
    void loadPlanStatus();
    try {
      window.addEventListener('idtoken:changed', handleRefresh as EventListener);
      window.addEventListener('focus', handleRefresh);
    } catch {}
    return () => {
      cancelled = true;
      try {
        window.removeEventListener('idtoken:changed', handleRefresh as EventListener);
        window.removeEventListener('focus', handleRefresh);
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!backfillOpen) {
      setBackfillError(null);
      setBackfillResult(null);
      setBackfillDryRun(false);
      setBackfillLoading(false);
      setUsingSampleBackfill(false);
    }
  }, [backfillOpen]);

  async function saveSimple(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(ev.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const review = String(fd.get('review_link') || '').trim();
    try {
      const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
      const headers: Record<string,string> = { 'Content-Type':'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const r = await fetch('/api/businesses/upsert', {
        method: 'POST', headers, credentials: 'include',
        body: JSON.stringify({ name, review_link: review || null }),
      });
      if (!r.ok) throw new Error(await r.text().catch(()=>String(r.status)));
      // Reload
      const r2 = await fetch('/api/dashboard/summary', { cache:'no-store', credentials:'include', headers: tok?{ Authorization:`Bearer ${tok}` }:{} });
      if (r2.ok) {
        const j2 = await r2.json() as { business: Business|null; stats?: Stats | null; recentFeedback?: FeedbackItem[] | null };
        setBusiness(j2.business);
        setStats(j2.stats ?? { reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
        setRecentFeedback(Array.isArray(j2.recentFeedback) ? j2.recentFeedback : []);
        if ((!j2.recentFeedback || j2.recentFeedback.length === 0) && j2.business) {
          await loadRecentFeedback(headers);
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setLoading(false); }
  }

  async function runSquareBackfill(dryRunOverride?: boolean) {
    if (!business?.id) return;
    setBackfillLoading(true);
    setBackfillError(null);
    try {
      const payload = {
        businessId: business.id,
        startDate: backfillStart || null,
        endDate: backfillEnd || null,
        dryRun: dryRunOverride ?? backfillDryRun,
        maxCustomers: backfillLimit,
      };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const tok = localStorage.getItem('idToken');
        if (tok) headers.Authorization = `Bearer ${tok}`;
      } catch {}
      const res = await fetch('/api/integrations/square/backfill', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText || 'Backfill failed'));
      }
      const data = await res.json() as BackfillResult;
      setBackfillResult(data);
      setBackfillDryRun(Boolean(data.dryRun));
      setUsingSampleBackfill(false);
      if (!data.dryRun) {
        const nowIso = new Date().toISOString();
        setSquare((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            lastBackfillAt: nowIso,
            latestJob: {
              id: data.jobId,
              status: 'completed',
              createdAt: nowIso,
              sentCount: data.sent,
              totalCustomers: data.totalConsidered,
            },
          };
        });
      }
    } catch (e) {
      setBackfillError(e instanceof Error ? e.message : 'Backfill failed');
    } finally {
      setBackfillLoading(false);
    }
  }

  const landingUrl = useMemo(() => (business?.id ? `${typeof window!=='undefined'?window.location.origin:''}/r/${encodeURIComponent(business.id)}` : null), [business?.id]);
  const planBadge = useMemo(() => {
    if (!planStatus || planStatus === 'loading') return { label: 'Checking plan…', tone: 'loading' as const, pending: true };
    const normalized = planStatus.toLowerCase();
    if (normalized === 'active') return { label: 'Pro plan', tone: 'pro' as const, pending: false };
    if (normalized === 'trialing') return { label: 'Pro trial', tone: 'pro' as const, pending: false };
    if (['past_due', 'unpaid', 'canceled', 'incomplete_expired', 'incomplete'].includes(normalized)) {
      return { label: 'Plan needs attention', tone: 'warn' as const, pending: false };
    }
    if (normalized === 'none') return { label: 'Starter plan', tone: 'neutral' as const, pending: false };
    return { label: `${planStatus} plan`, tone: 'neutral' as const, pending: false };
  }, [planStatus]);
  const planBadgeClass = useMemo(() => {
    if (planBadge.tone === 'pro') {
      return 'inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 backdrop-blur';
    }
    if (planBadge.tone === 'warn') {
      return 'inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 backdrop-blur';
    }
    if (planBadge.tone === 'loading') {
      return 'inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur animate-pulse';
    }
    return 'inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur';
  }, [planBadge]);

  const isProPlan = useMemo(() => {
    if (!planStatus || planStatus === 'loading') return false;
    const normalized = planStatus.toLowerCase();
    return normalized === 'active' || normalized === 'trialing';
  }, [planStatus]);
  const planStatusKnown = planStatus != null && planStatus !== 'loading';

  const metrics = useMemo(() => ([
    {
      key: 'rating' as const,
      label: 'Google rating',
      value: stats.averageRating != null ? stats.averageRating.toFixed(1) : '—',
      caption: 'Latest rating pulled from Google Business',
      accent: 'from-amber-400 via-orange-400 to-rose-400',
    },
    {
      key: 'reviews' as const,
      label: 'Reviews this month',
      value: stats.reviewsThisMonth.toLocaleString(),
      caption: 'New public reviews attributed to your invites',
      accent: 'from-sky-400 via-indigo-500 to-violet-500',
    },
    {
      key: 'scans' as const,
      label: 'Share link scans',
      value: stats.shareLinkScans.toLocaleString(),
      caption: 'Unique QR or link visits in the last 30 days',
      accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    },
  ]), [stats.averageRating, stats.reviewsThisMonth, stats.shareLinkScans]);

  const handleCopyLanding = useCallback(async () => {
    if (!landingUrl) return;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(landingUrl);
      setCopyState('copied');
    } catch {
      try {
        if (typeof document !== 'undefined') {
          const textarea = document.createElement('textarea');
          textarea.value = landingUrl;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopyState('copied');
          return;
        }
        throw new Error('Clipboard unavailable');
      } catch {
        setCopyState('error');
      }
    }
  }, [landingUrl]);

  useEffect(() => {
    if (copyState === 'idle' || typeof window === 'undefined') return undefined;
    const timer = window.setTimeout(() => setCopyState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const showUpgradePrompt = Boolean(
    planStatus && planStatus !== 'loading' && !['active', 'trialing', 'starter'].includes(planStatus)
  );

  useEffect(() => {
    if (!planStatus || planStatus === 'loading') return;
    if (showUpgradePrompt) {
      const search = new URLSearchParams();
      search.set('welcome', '1');
      search.set('from', 'dashboard');
      window.location.replace(`/pricing?${search.toString()}`);
    }
  }, [planStatus, showUpgradePrompt]);

  return (
    <>
      <main className="relative min-h-screen overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-[-360px] h-[620px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)] blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/60 to-white" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 px-6 py-8 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:px-8">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/70 via-transparent to-rose-200/60" />
            <div className="pointer-events-none absolute -left-24 top-2 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-44 w-44 rounded-full bg-purple-400/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                {planBadge && (
                  <span className={planBadgeClass}>{planBadge.label}</span>
                )}
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                    Your reputation command center
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">
                    Keep a pulse on reviews, share links, and automations from an adaptive dashboard built for modern operators.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
                {business ? (
                  <>
                    <Link
                      href="/settings"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10"
                    >
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.89-1.543.877-3.31 2.42-2.42.996.575 2.245.115 2.573-1.065z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Settings
                    </Link>
                    <Link
                      href="/onboarding/business?edit=1"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-900/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-900"
                    >
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 21v-12.75a.75.75 0 01.75-.75H8.25a.75.75 0 01.75.75V21m6 0V5.25a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-12-6h3m6 0h3" />
                      </svg>
                      Manage business
                    </Link>
                  </>
                ) : (
                  <a
                    href="/onboarding/business"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
                  >
                    Complete setup
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200/70 bg-rose-50/90 p-4 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {planStatus === 'loading' && (
            <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-indigo-200/60 bg-indigo-50/90 p-4 text-sm text-indigo-700 shadow-sm">
              <span className="font-medium">Confirming your subscription…</span>
              <span>
                This should only take a moment.
                {typeof window !== 'undefined' && (
                  <>
                    {' '}Having trouble? <button onClick={() => window.location.reload()} className="underline">Refresh</button> or <a href="/pricing" className="underline">choose a plan</a>.
                  </>
                )}
              </span>
            </div>
          )}

          {showUpgradePrompt && (
            <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-5 py-4 text-sm text-amber-800 shadow-lg shadow-amber-200/60 md:flex-row md:items-center md:justify-between">
              <span className="font-medium">Unlock the full Reviews & Marketing suite with Pro—advanced analytics, QR branding, multi-location teams, and automations.</span>
              <a href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/40 transition hover:-translate-y-0.5">
                View plans
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              </a>
            </div>
          )}

          {business ? (
            <section className="mt-8 space-y-8">
              <div>
                {isProPlan ? (
                  square?.connected ? (
                    <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-r from-indigo-500/10 via-white to-white px-6 py-6 shadow-lg shadow-indigo-200/60">
                      <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-40 bg-gradient-to-l from-indigo-100/70 to-transparent" />
                      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-3 text-slate-900">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-700">
                          Square connected
                        </div>
                        <h2 className="text-lg font-semibold">Invite past Square customers</h2>
                        <p className="max-w-2xl text-sm text-slate-600">
                          Pull recent customers from Square and follow up with a review request. We automatically skip anyone contacted in the last {BACKFILL_LOOKBACK_DAYS} days.
                        </p>
                        <div className="text-xs text-slate-500">
                          <p>Last backfill: {formatDateTime(square?.lastBackfillAt)}</p>
                          {square?.latestJob && (
                            <p>
                              Latest job: {square.latestJob.status} • {square.latestJob.sentCount ?? 0} sent / {square.latestJob.totalCustomers ?? 0} considered
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => {
                            setBackfillDryRun(false);
                            setBackfillOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:-translate-y-0.5 hover:bg-indigo-500"
                        >
                          Run backfill
                        </button>
                        <button
                          onClick={() => {
                            setBackfillDryRun(true);
                            setBackfillOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          Preview first
                        </button>
                      </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-6 shadow-lg shadow-slate-900/5">
                      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-transparent to-indigo-100" />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2 text-slate-900">
                          <h2 className="text-lg font-semibold">Connect Square to backfill past customers</h2>
                          <p className="max-w-2xl text-sm text-slate-600">Import your Square customers and invite them to leave a review in a few clicks.</p>
                        </div>
                        <a
                          href="/integrations/square"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900/95 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5 hover:bg-slate-900"
                        >
                          Connect Square
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )
                ) : planStatusKnown ? (
                  <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-6 py-6 shadow-lg shadow-amber-200/60">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2 text-amber-900">
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                          Pro feature
                        </div>
                        <h2 className="text-lg font-semibold">Unlock Square automations with Pro</h2>
                        <p className="max-w-2xl text-sm text-amber-800">
                          Upgrade to the Pro plan to connect Square, backfill recent customers, and trigger automated review requests.
                        </p>
                      </div>
                      <a
                        href="/pricing?from=dashboard&welcome=1"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/40 transition hover:-translate-y-0.5 hover:bg-amber-400"
                      >
                        View Pro plans
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/5 backdrop-blur"
                  >
                    <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${metric.accent} opacity-[0.14]`} />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</div>
                        <div className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</div>
                        <p className="mt-3 text-xs text-slate-500">{metric.caption}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
                        <MetricIcon type={metric.key} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.5fr),minmax(0,1fr)]">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Primary location</div>
                  <div className="mt-3 text-xl font-semibold text-slate-900">{business.name}</div>
                  {business.contact_phone && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5c0-1 .8-1.8 1.8-1.8h1.7c.8 0 1.4.6 1.6 1.3l.5 2a1.8 1.8 0 01-.5 1.8l-.9.9a13.5 13.5 0 005.4 5.4l.9-.9a1.8 1.8 0 011.8-.5l2 .5c.7.2 1.3.8 1.3 1.6v1.7c0 1-.8 1.8-1.8 1.8h-.9C8.9 19 1 11.1 1 1.8v-.9z" />
                      </svg>
                      {formatPhone(business.contact_phone)}
                    </div>
                  )}
                  <p className="mt-4 text-sm text-slate-600">
                    Update your business profile any time to refresh your share pages, QR download, and automated emails.
                  </p>
                  <Link
                    href="/settings"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Go to settings
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>

                {landingUrl && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Review landing link</div>
                        <p className="mt-2 text-sm text-slate-600">
                          Share anywhere—QR or direct. We’ll keep the destination optimized for every device.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-[360px]">
                        <div className="flex w-full flex-col gap-2">
                          <div className="flex items-stretch overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-inner">
                            <input
                              className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-700"
                              readOnly
                              value={landingUrl}
                            />
                            <button
                              type="button"
                              onClick={handleCopyLanding}
                              className="h-full px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                            >
                              {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
                            </button>
                          </div>
                          <span
                            className={`text-xs ${copyState === 'copied' ? 'text-emerald-600' : copyState === 'error' ? 'text-rose-600' : 'text-slate-500'}`}
                            aria-live="polite"
                          >
                            {copyState === 'copied'
                              ? 'Review landing link copied to clipboard'
                              : copyState === 'error'
                                ? 'Unable to copy link — try again'
                                : ' '}
                          </span>
                        </div>
                        <a
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          target="_blank"
                          href={landingUrl}
                          rel="noopener"
                          referrerPolicy="no-referrer"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-inner">
                        <img
                          src={`/api/qr?data=${encodeURIComponent(landingUrl)}&format=png&scale=8`}
                          alt="QR code linking to your review landing page"
                          className="h-full w-full p-3"
                          loading="lazy"
                        />
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>Ideal for signage, receipts, and campaigns. We refresh the QR automatically.</p>
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-500"
                          href={`/api/qr?data=${encodeURIComponent(landingUrl)}&format=png&scale=8`}
                          download
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 15v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                          </svg>
                          Download PNG
                        </a>
                        {copyState === 'error' && (
                          <p className="text-xs text-rose-500">Unable to copy automatically. Please copy the link manually.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Latest feedback</div>
                    <p className="mt-2 text-sm text-slate-600">Private submissions from your review landing. Only your team can see these.</p>
                  </div>
                  <Link href="/feedback" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                    View all
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                {recentFeedback.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/60 px-5 py-6 text-sm text-slate-600">
                    No feedback yet. Share your landing link to start gathering responses.
                  </div>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {recentFeedback.map((item) => (
                      <li key={item.id} className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-400 to-violet-500" aria-hidden="true" />
                        <div className="ml-3 flex flex-col gap-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{item.name || 'Anonymous'}</div>
                              <div className="text-xs text-slate-500">{item.email || '—'}</div>
                              {item.phone && <div className="text-xs text-slate-500">{formatPhone(item.phone)}</div>}
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600">
                              {item.rating}★ rating
                            </div>
                          </div>
                          {item.comment && (
                            <p className="text-sm text-slate-600 whitespace-pre-line">{item.comment}</p>
                          )}
                          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                            {item.marketing_consent ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Follow-up permitted
                              </span>
                            ) : (
                              <span>Follow-up not permitted</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : (
            <section className="mt-8 overflow-hidden rounded-3xl border border-dashed border-indigo-200/80 bg-white/90 px-6 py-8 shadow-xl shadow-indigo-200/40 backdrop-blur">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1fr)]">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-700">Step 1</span>
                  <h2 className="text-2xl font-semibold text-slate-900">Connect your business profile</h2>
                  <p className="text-sm text-slate-600">
                    Enter your business details and an optional Google review link. We’ll generate your branded landing page and QR instantly.
                  </p>
                </div>
                <form onSubmit={saveSimple} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-inner">
                  <label className="block text-sm font-medium text-slate-700">
                    Business name
                    <input
                      name="name"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Acme Bakery"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Google review link <span className="font-normal text-slate-400">(optional)</span>
                    <input
                      name="review_link"
                      className="mt-2 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="https://search.google.com/local/writereview?..."
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Saving…' : 'Save and continue'}
                  </button>
                </form>
              </div>
            </section>
          )}

          {finalizing && !business && (
            <div className="mt-6 rounded-2xl border border-indigo-200/70 bg-indigo-50/80 p-4 text-sm text-indigo-700">
              Finalizing your business setup…
            </div>
          )}
        </div>
      </main>
      {backfillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 py-8">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100/80 bg-white/95 shadow-[0_40px_80px_rgba(15,23,42,0.28)]">
            <div className="pointer-events-none absolute -top-24 right-[-60px] h-60 w-60 rounded-full bg-indigo-100/80 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-[-40px] h-60 w-60 rounded-full bg-purple-100/70 blur-3xl" />
            <div className="relative flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Square backfill</h2>
                <p className="mt-1 text-sm text-slate-600">Pick a window, preview in seconds, then send follow-ups without duplicating outreach.</p>
              </div>
              <button
                onClick={() => setBackfillOpen(false)}
                className="rounded-full border border-slate-200/70 bg-white/70 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close backfill"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                void runSquareBackfill(false);
              }}
              className="relative px-6 py-6 space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Start date
                  <input
                    type="date"
                    value={backfillStart}
                    max={backfillEnd}
                    onChange={(e) => setBackfillStart(e.target.value)}
                    className="mt-2 rounded-2xl border border-slate-200/80 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  End date
                  <input
                    type="date"
                    value={backfillEnd}
                    min={backfillStart}
                    onChange={(e) => setBackfillEnd(e.target.value)}
                    className="mt-2 rounded-2xl border border-slate-200/80 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Max customers
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={backfillLimit}
                    onChange={(e) => setBackfillLimit(Number(e.target.value) || BACKFILL_DEFAULT_LIMIT)}
                    className="mt-2 rounded-2xl border border-slate-200/80 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={backfillDryRun}
                    onChange={(e) => setBackfillDryRun(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Preview only (no emails sent)
                </label>
              </div>

              {backfillError && (
                <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">{backfillError}</div>
              )}

              {backfillResult ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div className="text-sm font-medium text-slate-900 mb-2">Summary</div>
                  <div className="text-xs text-slate-600 mb-3">
                    {backfillResult.sent.toLocaleString()} {backfillResult.dryRun ? 'would be sent' : 'emails sent'} • {backfillResult.skipped.toLocaleString()} skipped • {backfillResult.totalConsidered.toLocaleString()} considered
                  </div>
                  <ul className="max-h-48 overflow-y-auto space-y-1 text-xs">
                    {backfillResult.results.slice(0, 20).map((item, idx) => (
                      <li key={`${item.email}-${idx}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                        <span className="font-medium text-slate-800">{item.email}</span>
                        <span className="text-slate-600">{item.status}{item.reason ? ` • ${item.reason}` : ''}</span>
                      </li>
                    ))}
                    {backfillResult.results.length > 20 && (
                      <li className="text-center text-slate-500">+{backfillResult.results.length - 20} more…</li>
                    )}
                  </ul>
                  {usingSampleBackfill && (
                    <p className="mt-3 text-xs text-slate-500 text-center">This is demo data. Run Preview recipients to replace it with live results.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/80 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900 mb-1">Example preview</div>
                  <p className="mb-3 text-xs text-slate-500">Run Preview recipients to see your own list. Here’s what a sample dry run looks like.</p>
                  <div className="text-xs text-slate-600 mb-3">
                    {SAMPLE_BACKFILL_PREVIEW.sent.toLocaleString()} would be sent • {SAMPLE_BACKFILL_PREVIEW.skipped.toLocaleString()} skipped • {SAMPLE_BACKFILL_PREVIEW.totalConsidered.toLocaleString()} considered
                  </div>
                  <ul className="space-y-1 text-xs">
                    {SAMPLE_BACKFILL_PREVIEW.results.slice(0, 4).map((item, idx) => (
                      <li key={`${item.email}-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-3 py-2">
                        <span className="font-medium text-slate-800">{item.email}</span>
                        <span className="text-slate-500">{item.status}{item.reason ? ` • ${item.reason}` : ''}</span>
                      </li>
                    ))}
                    <li className="text-center text-slate-400">Your preview will list real customers here.</li>
                  </ul>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">Need something to demo? Load the sample list into the summary above.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setBackfillResult(SAMPLE_BACKFILL_PREVIEW);
                        setBackfillDryRun(true);
                        setUsingSampleBackfill(true);
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      Load sample data
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">We skip customers contacted in the last {BACKFILL_LOOKBACK_DAYS} days and anyone without an email address.</div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setBackfillOpen(false)} className="rounded-2xl border border-slate-200/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">Cancel</button>
                    <button type="button" disabled={backfillLoading} onClick={() => void runSquareBackfill(true)} className="rounded-2xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50">Preview recipients</button>
                    <button type="submit" disabled={backfillLoading} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{backfillLoading ? 'Working…' : 'Send review emails'}</button>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-right">
                    Preview lists who qualifies without sending anything. Send review emails immediately delivers messages to the matched customers.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MetricIcon({ type }: { type: 'rating' | 'reviews' | 'scans' }) {
  if (type === 'rating') {
    return (
      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.048 2.927c.3-.921 1.604-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.384 2.46a1 1 0 00-.364 1.118l1.286 3.966c.3.922-.755 1.688-1.539 1.118l-3.384-2.46a1 1 0 00-1.176 0l-3.384 2.46c-.783.57-1.838-.196-1.539-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.046 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" />
      </svg>
    );
  }
  if (type === 'reviews') {
    return (
      <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-2.994-.46l-3.78 1.51a1 1 0 01-1.313-1.148l.73-3.102A7.38 7.38 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 14h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z" />
    </svg>
  );
}
