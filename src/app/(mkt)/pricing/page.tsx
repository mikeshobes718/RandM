"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [loading, setLoading] = useState(false);
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
    let cancelled = false;

    const applyStatus = (status: string | null | undefined) => {
      const normalized = (status || '').toLowerCase();
      const finalStatus = normalized || 'none';
      if (cancelled) return;
      setPlanStatus(finalStatus);
      setIsPro(normalized === 'active' || normalized === 'trialing');
    };

    const fallbackToEntitlements = async (headers: Record<string, string>) => {
      try {
        let r = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include', headers });
        if (!r.ok) r = await fetch('/api/entitlements', { cache: 'no-store', headers });
        if (!r.ok) return;
        const j = (await r.json().catch(() => null)) as { pro?: boolean } | null;
        applyStatus(j?.pro ? 'active' : 'none');
      } catch {}
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
      setLoading(true);
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
      try { if (j?.mode) localStorage.setItem('stripe:lastMode', String(j.mode)); } catch {}
      if (j?.url) window.location.href = j.url;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Checkout failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    try {
      setError(null);
      setLoading(true);
      let modeParam = '';
      try {
        const lastMode = (localStorage.getItem('stripe:lastMode') || '').toLowerCase();
        if (lastMode === 'test') modeParam = '?mode=test';
      } catch {}
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('idToken') || '';
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/stripe/portal${modeParam}`, {
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
      setLoading(false);
    }
  }

  async function handleProCta() {
    if (loading) return;
    if (authed && planStatus === 'loading') return;
    if (isPro) {
      await openBillingPortal();
    } else {
      await handleSubscribeWithPlan(billing);
    }
  }

  const starterPriceText = 'Free';
  const proPrice = billing === 'monthly' ? 49.99 : 499.0;
  const planChecking = authed && planStatus === 'loading';
  const starterCtaLabel = planChecking ? 'Checking plan...' : authed ? 'Go to Dashboard' : 'Get Started Free';
  const starterCtaHref = authed ? '/dashboard' : '/register';
  const proCtaLabel = planChecking
    ? 'Checking plan...'
    : isPro
      ? 'Manage Billing'
      : billing === 'monthly'
        ? 'Upgrade to Pro (Monthly)'
        : 'Upgrade to Pro (Yearly)';
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 mesh-bg">
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
      <section className="relative overflow-hidden pt-20 pb-10">
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)] bg-gradient-to-b from-blue-100/60 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 text-blue-800 text-sm font-medium mb-6 shadow ring-1 ring-blue-200">Starter is free • Upgrade anytime</span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to collect more reviews and grow reputation.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 bg-white/80 border border-gray-200 rounded-full p-1 shadow-sm">
            <button
              className={`${billing === 'monthly' ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-gray-700"} px-4 py-2 rounded-full text-sm font-medium transition`}
              onClick={() => { setBilling('monthly'); try{ localStorage.setItem('billingPreference','monthly'); }catch{} }}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              className={`${billing === 'yearly' ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-gray-700"} px-4 py-2 rounded-full text-sm font-medium transition`}
              onClick={() => { setBilling('yearly'); try{ localStorage.setItem('billingPreference','yearly'); }catch{} }}
              aria-pressed={billing === 'yearly'}
            >
              Yearly
            </button>
            <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 ml-1">Save vs monthly</span>
          </div>
          {billing === 'yearly' && (
            <div className="mt-2 text-sm text-gray-600">≈ $41.58/mo when billed yearly</div>
          )}
          {/* Test checkout toggle (local only) */}
        </div>
      </section>

      {/* Guarantee strip */}
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-gray-800 font-medium">30‑day money‑back guarantee</div>
            <div className="text-gray-500 text-sm">No setup fees • Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 gradient-border">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 mb-6">Perfect for small businesses getting started</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{starterPriceText}</span>
                </div>
                <p className="text-sm text-gray-500">Freemium plan • No credit card required</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Up to 5 review requests/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">One QR code (shared)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Email request templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>
              
              <Link 
                href={starterCtaHref} 
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {starterCtaLabel}
              </Link>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 gradient-border">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600 mb-6">For growing businesses that need more power</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">${proPrice}</span>
                  <span className="text-xl text-gray-600">{billing === 'monthly' ? '/mo' : '/yr'}</span>
                </div>
                <p className="text-sm text-gray-500">{billing === 'monthly' ? '$49.99 per month' : '$499 per year'} • Cancel anytime</p>
                {billing === 'yearly' && (
                  <p className="text-xs text-gray-400 mt-1">≈ $41.58/mo when billed yearly</p>
                )}
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Everything in Starter</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Custom domains & branding</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
                
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Team collaboration</span>
                </li>
            </ul>
              
              <button 
                onClick={handleProCta} 
                disabled={loading || planChecking}
                className="w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                {loading ? "Processing..." : proCtaLabel}
            </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 gradient-border">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">For large teams and complex needs</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">Custom</span>
                </div>
                <p className="text-sm text-gray-500">Tailored solutions for your business</p>
          </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">SLA guarantees</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">On-premise options</span>
                </li>
            </ul>
              
              <button 
                onClick={() => alert("Contact sales for Enterprise plan")} 
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Strip */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-semibold text-gray-900">Feature</div>
              <div className="font-semibold text-gray-900 text-center">Starter</div>
              <div className="font-semibold text-gray-900 text-center">Pro</div>
              <div className="py-2 text-gray-700">Unlimited review links</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-gray-700">One QR code (shared)</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-gray-700">Custom branding</div>
              <div className="py-2 text-center">–</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-gray-700">Advanced analytics</div>
              <div className="py-2 text-center">–</div>
              <div className="py-2 text-center">✓</div>
              <div className="py-2 text-gray-700">Priority support</div>
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
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. 
                You&apos;ll continue to have access to your plan until the end of your current billing period.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Is there a free plan?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes — our Starter plan is free and lets you connect your business, manage your main review link, and generate a QR code. Upgrade to Pro anytime for advanced features.
              </p>
        </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
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
              disabled={loading || planChecking}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : proCtaLabel}
            </button>
            <Link 
              href={starterCtaHref}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              {starterCtaLabel}
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">No credit card required • Starter is free</p>
      </div>
      </section>
    </main>
  );
}
