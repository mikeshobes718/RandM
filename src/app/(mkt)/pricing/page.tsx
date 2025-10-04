"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [starterLoading, setStarterLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(() => {
    if (typeof window === 'undefined') return 'monthly';
    try { const v = localStorage.getItem('billingPreference'); if (v==='yearly' || v==='monthly') return v; } catch {}
    return 'monthly';
  });
  const [welcome, setWelcome] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [planStatus, setPlanStatus] = useState<'loading' | 'none' | string>('loading');
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    try { setWelcome(new URL(window.location.href).searchParams.get('welcome') === '1'); } catch {}
  }, []);

  useEffect(() => {
    if (hasPlan) setWelcome(false);
  }, [hasPlan]);

  useEffect(() => {
    let cancelled = false;

    const applyStatus = (status: string | null | undefined) => {
      const normalized = (status || '').toLowerCase();
      const finalStatus = normalized || 'none';
      if (cancelled) return;
      setPlanStatus(finalStatus);
      setIsPro(normalized === 'active' || normalized === 'trialing');
      setHasPlan(normalized === 'starter' || normalized === 'active' || normalized === 'trialing');
    };

    const fallbackToEntitlements = async (headers: Record<string, string>) => {
      try {
        let r = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include', headers });
        if (!r.ok) r = await fetch('/api/entitlements', { cache: 'no-store', headers });
        if (!r.ok) {
          applyStatus('none');
          return;
        }
        const j = (await r.json().catch(() => null)) as { pro?: boolean } | null;
        applyStatus(j?.pro ? 'active' : 'none');
      } catch {
        applyStatus('none');
      }
    };

    const refresh = async () => {
      let token = '';
      try { token = localStorage.getItem('idToken') || ''; } catch {}
      let nextAuthed = Boolean(token);
      try {
        let authRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!authRes.ok && token) {
          authRes = await fetch('/api/auth/me', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
        }
        if (authRes.ok) {
          nextAuthed = true;
        }
      } catch {}
      if (!cancelled) setAuthed(nextAuthed);
      if (!nextAuthed) {
        applyStatus('none');
        return;
      }
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      let resolved = false;
      try {
        let planRes = await fetch('/api/plan/status', { cache: 'no-store', credentials: 'include', headers });
        if (!planRes.ok) {
          planRes = await fetch('/api/plan/status', { cache: 'no-store', headers });
        }
        if (planRes.ok) {
          const data = (await planRes.json().catch(() => null)) as { status?: string } | null;
          const status = typeof data?.status === 'string' ? data.status : 'none';
          applyStatus(status);
          resolved = true;
        }
      } catch {}
      if (!resolved) {
        await fallbackToEntitlements(headers);
      }
    };

    void refresh();
    const handleChange = () => { void refresh(); };
    try {
      window.addEventListener('focus', handleChange);
      window.addEventListener('idtoken:changed', handleChange as EventListener);
    } catch {}
    return () => {
      cancelled = true;
      try {
        window.removeEventListener('focus', handleChange);
        window.removeEventListener('idtoken:changed', handleChange as EventListener);
      } catch {}
    };
  }, []);

  async function handleSubscribeWithPlan(plan: 'monthly' | 'yearly') {
    try {
      setError(null);
      setProLoading(true);
      // Require verified email before starting checkout
      try {
        const idTok = (() => { try { return localStorage.getItem('idToken') || ''; } catch { return ''; } })();
        // Try cookie path first
        let r = await fetch('/api/auth/me', { cache:'no-store', credentials:'include' });
        // Fallback to bearer if no cookie session
        if (!r.ok && idTok) {
          r = await fetch('/api/auth/me', { cache:'no-store', headers: { Authorization: `Bearer ${idTok}` } });
        }
        if (r.ok) {
          const j = await r.json();
          if (!j?.emailVerified) {
            window.location.href = '/verify-email?next=/pricing';
            return;
          }
        }
      } catch {}
      // If signed in, server will derive uid/email from cookie; otherwise prompt email
      const hasToken = (() => { try { return Boolean(localStorage.getItem('idToken')); } catch { return false; } })();
      const payload: { plan: 'monthly'|'yearly'; uid?: string; email?: string } = { plan };
      if (!hasToken) {
        let email = '';
        try { email = localStorage.getItem('userEmail') || ''; } catch {}
        if (!email) {
          const entered = window.prompt('Enter your email for the Stripe checkout:');
          if (!entered) throw new Error('Email is required for checkout');
          email = entered;
        }
        payload.uid = 'anon';
        payload.email = email;
      }
      const idTok2 = (() => { try { return localStorage.getItem('idToken') || ''; } catch { return ''; } })();
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      if (idTok2) headers.Authorization = `Bearer ${idTok2}`;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      try { if (j?.id) localStorage.setItem('stripe:lastSessionId', String(j.id)); } catch {}
      if (j?.url) window.location.href = j.url;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Checkout failed";
      setError(message);
    } finally {
      setProLoading(false);
    }
  }

  async function openBillingPortal() {
    try {
      setError(null);
      setProLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('idToken') || '';
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (j?.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error('Unable to open billing portal');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to open billing portal';
      setError(message);
    } finally {
      setProLoading(false);
    }
  }

  async function handleProCta() {
    if (proLoading) return;
    if (authed && planStatus === 'loading') return;
    if (isPro) {
      await openBillingPortal();
    } else {
      await handleSubscribeWithPlan(billing);
    }
  }

  async function handleStarterCta() {
    if (!authed) {
      window.location.href = '/register';
      return;
    }
    if (planStatus === 'starter') {
      window.location.href = '/dashboard';
      return;
    }
    if (isPro) {
      window.location.href = '/dashboard';
      return;
    }
    if (planStatus === 'loading' || starterLoading) return;
    try {
      setError(null);
      setStarterLoading(true);
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('idToken');
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch('/api/plan/start', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (res.status === 401) {
        setStarterLoading(false);
        const next = encodeURIComponent('/pricing');
        window.location.href = `/login?next=${next}`;
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => 'Activation failed');
        throw new Error(text);
      }
      setPlanStatus('starter');
      setHasPlan(true);
      setIsPro(false);

      let redirectTarget = '/onboarding/business';
      const idTokenValue = headers.Authorization?.replace(/^Bearer\s+/i, '').trim();
      const decodedClaims = (() => {
        if (!idTokenValue) return null;
        try {
          const [, payloadB64] = idTokenValue.split('.');
          if (!payloadB64) return null;
          const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
          const json = typeof atob === 'function' ? atob(normalized) : Buffer.from(normalized, 'base64').toString('utf8');
          return JSON.parse(json) as { email_verified?: boolean };
        } catch {
          return null;
        }
      })();
      try {
        const headersAuth: Record<string, string> = {};
        if (headers.Authorization) headersAuth.Authorization = headers.Authorization;
        let me = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!me.ok && headersAuth.Authorization) {
          me = await fetch('/api/auth/me', { cache: 'no-store', headers: headersAuth });
        }
        if (me.ok) {
          const payload = await me.json().catch(() => null) as { emailVerified?: boolean } | null;
          const verified = payload?.emailVerified;
          if (verified === false) {
            redirectTarget = '/verify-email?next=%2Fonboarding%2Fbusiness';
          } else {
            try {
              let bizRes = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include' });
              if (!bizRes.ok && headersAuth.Authorization) {
                bizRes = await fetch('/api/businesses/me', { cache: 'no-store', headers: headersAuth });
              }
              if (bizRes.ok) {
                const bizPayload = await bizRes.json().catch(() => null) as { business?: unknown } | null;
                if (bizPayload && (bizPayload as { business?: unknown }).business) {
                  redirectTarget = '/dashboard';
                }
              }
            } catch {
              // ignore and keep onboarding target
            }
          }
        }
      } catch {}

      setStarterLoading(false);
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, redirectTarget === '/dashboard' ? 400 : 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to activate Starter';
      setError(message);
      setStarterLoading(false);
    }
  }

  const starterPriceText = 'Free';
  const proPrice = billing === 'monthly' ? 49.99 : 499.0;
  const planChecking = authed && planStatus === 'loading';
  const starterActive = planStatus === 'starter';
  const starterButtonLabel = planChecking
    ? 'Checking plan...'
    : starterLoading
      ? 'Activating Starter...'
      : starterActive
        ? 'Continue setup'
        : isPro
          ? 'Go to Dashboard'
          : authed
            ? 'Activate Starter'
            : 'Get Started Free';
  const starterDisabled = planChecking || starterLoading;
  const proCtaLabel = planChecking
    ? 'Checking plan...'
    : proLoading
      ? 'Processing...'
      : isPro
        ? 'Manage Billing'
        : billing === 'monthly'
          ? 'Upgrade to Pro (Monthly)'
          : 'Upgrade to Pro (Yearly)';
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-280px] h-[500px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_60%)] blur-3xl animate-float-blob" />
        <div className="absolute left-[-200px] bottom-[-160px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)] blur-3xl animate-float-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute right-[-220px] top-1/3 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.22),transparent_75%)] blur-3xl animate-float-blob" style={{ animationDelay: '4s' }} />
      </div>
      {welcome && (
        <div className="sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm">
              Your email is verified — choose a plan to unlock your dashboard.
            </div>
          </div>
        </div>
      )}
      {/* Pricing Header */}
      <section className="relative px-4 pt-24 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/90 shadow-lg backdrop-blur">Starter is free • Upgrade anytime</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-slate-300 md:text-xl">
            Everything you need to collect more reviews, nurture customer trust, and measure the impact.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/85 p-1 shadow-sm shadow-slate-900/10 backdrop-blur">
            <button
              className={`${billing === 'monthly' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-700'} rounded-full px-4 py-2 text-sm font-medium transition`}
              onClick={() => { setBilling('monthly'); try{ localStorage.setItem('billingPreference','monthly'); }catch{} }}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              className={`${billing === 'yearly' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-700'} rounded-full px-4 py-2 text-sm font-medium transition`}
              onClick={() => { setBilling('yearly'); try{ localStorage.setItem('billingPreference','yearly'); }catch{} }}
              aria-pressed={billing === 'yearly'}
            >
              Yearly
            </button>
            <span className="hidden sm:inline rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Save vs monthly</span>
          </div>
          {billing === 'yearly' && (
            <div className="mt-2 text-sm text-slate-600">≈ $41.58/mo when billed yearly</div>
          )}
          {/* Test checkout toggle (local only) */}
        </div>
      </section>

      {/* Guarantee strip */}
      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/85 p-5 text-sm text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur md:flex-row md:gap-6">
            <div className="text-sm font-semibold text-slate-800">30‑day money‑back guarantee</div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>No setup fees</span>
              <span>•</span>
              <span>Cancel anytime</span>
              <span>•</span>
              <span>Live onboarding included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Starter Plan */}
            <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">Starter</h3>
                <p className="text-slate-600 mb-6 text-sm">Perfect for small businesses getting started</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{starterPriceText}</span>
                </div>
                <p className="text-xs text-slate-500">Freemium plan • No credit card required</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Up to 5 review requests/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">One QR code (shared)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Email request templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Email support</span>
                </li>
              </ul>
              {authed ? (
                <button
                  onClick={handleStarterCta}
                  disabled={starterDisabled}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {starterButtonLabel}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
                >
                  {starterButtonLabel}
                </Link>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative rounded-3xl border border-indigo-300 bg-white/90 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur transition hover:-translate-y-1">
              <div className="absolute -top-5 left-1/2 w-max -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
                  Most Popular
                </span>
              </div>
              
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">Pro</h3>
                <p className="text-sm text-slate-600 mb-6">For growing businesses that need more power</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">${proPrice}</span>
                  <span className="text-xl text-slate-500">{billing === 'monthly' ? '/mo' : '/yr'}</span>
                </div>
                <p className="text-xs text-slate-500">{billing === 'monthly' ? '$49.99 per month' : '$499 per year'} • Cancel anytime</p>
                {billing === 'yearly' && (
                  <p className="mt-1 text-xs text-slate-400">≈ $41.58/mo when billed yearly</p>
                )}
              </div>

              <ul className="space-y-3 text-sm text-slate-600 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Multi-location dashboards & routing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 001.414 0l8-8a1 1 0 00-1.414-1.414L8 12.586 5.707 10.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Priority support</span>
                </li>
                
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Team collaboration</span>
                </li>
            </ul>
              
              <button 
                onClick={handleProCta} 
                disabled={proLoading || planChecking}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {proLoading ? "Processing…" : proCtaLabel}
            </button>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">Enterprise</h3>
                <p className="text-sm text-slate-600 mb-6">For large teams and complex needs</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">Custom</span>
                </div>
                <p className="text-xs text-slate-500">Tailored solutions for your business</p>
          </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">SLA guarantees</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">Custom domains & branding</span>
                </li>
            </ul>
              
              <a
                href="/contact"
                className="w-full inline-flex items-center justify-center rounded-2xl border border-purple-300 px-6 py-3 text-sm font-semibold text-purple-600 shadow-sm shadow-purple-500/20 transition hover:-translate-y-0.5 hover:bg-purple-50"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Strip */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur md:p-8">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-semibold text-slate-900">Feature</div>
              <div className="text-center font-semibold text-slate-900">Starter</div>
              <div className="text-center font-semibold text-slate-900">Pro</div>
              <div className="py-2 text-slate-600">Unlimited review links</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-slate-600">One QR code (shared)</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-slate-600">Multi-location dashboards</div>
              <div className="py-2 text-center">–</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-slate-600">Advanced analytics</div>
              <div className="py-2 text-center">–</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-slate-600">Priority support</div>
              <div className="py-2 text-center">–</div>
              <div className="py-2 text-center">✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. 
                You&apos;ll continue to have access to your plan until the end of your current billing period.
              </p>
            </div>
            
            <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Is there a free plan?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes — our Starter plan is free and lets you connect your business, manage your main review link, and generate a QR code. Upgrade to Pro anytime for advanced features.
              </p>
        </div>

            <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. 
                All payments are processed securely through Stripe.
              </p>
        </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes! We offer a 20% discount when you choose annual billing. This saves you money and 
                gives you peace of mind with a longer commitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to start collecting more reviews?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join hundreds of businesses already growing their reputation. Get started free and upgrade anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleProCta}
              disabled={proLoading || planChecking}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proLoading ? 'Processing...' : proCtaLabel}
            </button>
            {authed ? (
              <button
                onClick={handleStarterCta}
                disabled={starterDisabled}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starterButtonLabel}
              </button>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {starterButtonLabel}
              </Link>
            )}
          </div>
          <p className="text-blue-200 text-sm mt-6">No credit card required • Starter is free</p>
      </div>
      </section>
    </main>
  );
}
