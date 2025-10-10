"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [starterLoading, setStarterLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proError, setProError] = useState<string | null>(null);
  
  // Debug error state changes
  useEffect(() => {
    console.log('Error state changed to:', error);
  }, [error]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(() => {
    if (typeof window === 'undefined') return 'monthly';
    try { const v = localStorage.getItem('billingPreference'); if (v==='yearly' || v==='monthly') return v; } catch {}
    return 'monthly';
  });
  const [welcome, setWelcome] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [planStatus, setPlanStatus] = useState<'loading' | 'none' | string>('loading');
  const [isPro, setIsPro] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [selectedPlanFromStorage, setSelectedPlanFromStorage] = useState<'starter' | 'pro' | null>(null);
  useEffect(() => {
    try { setWelcome(new URL(window.location.href).searchParams.get('welcome') === '1'); } catch {}
    
    // Check for selected plan in localStorage
    const checkStoredPlan = () => {
      try {
        const storedPlan = localStorage.getItem('selectedPlan') as 'starter' | 'pro' | null;
        setSelectedPlanFromStorage(storedPlan);
      } catch {}
    };
    
    checkStoredPlan();
    
    // Listen for storage changes (when user selects plan on another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedPlan') {
        checkStoredPlan();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (hasPlan) setWelcome(false);
  }, [hasPlan]);

  // Refresh onboarding state when plan status changes to starter
  useEffect(() => {
    if (planStatus === 'starter' && !onboardingComplete && !hasBusiness) {
      // Trigger a refresh to get the latest business state
      const refreshBusinessState = async () => {
        try {
          const headers: Record<string, string> = {};
          try {
            const token = localStorage.getItem('idToken') || '';
            if (token) headers.Authorization = `Bearer ${token}`;
          } catch {}
          
          let businessRes = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers });
          if (!businessRes.ok) {
            businessRes = await fetch('/api/businesses/me', { cache: 'no-store', headers });
          }
          if (businessRes.ok) {
            const businessData = (await businessRes.json().catch(() => null)) as { business?: any } | null;
            const business = businessData?.business;
            const hasBusinessData = Boolean(business);
            const isOnboardingComplete = hasBusinessData && business?.google_place_id;
            
            
            setHasBusiness(hasBusinessData);
            setOnboardingComplete(isOnboardingComplete);
          }
        } catch (error) {
          // Silently handle error
        }
      };
      
      refreshBusinessState();
    }
  }, [planStatus, onboardingComplete, hasBusiness]);

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
        // Check if user has any business (indicates starter plan)
        let businessRes = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers });
        if (!businessRes.ok) {
          businessRes = await fetch('/api/businesses/me', { cache: 'no-store', headers });
        }
        if (businessRes.ok) {
          const businessData = (await businessRes.json().catch(() => null)) as { business?: any } | null;
          console.log('🔍 Business data:', businessData);
          if (businessData?.business) {
            // User has a business, so they're on starter plan
            console.log('✅ Detected starter plan via business data');
            applyStatus('starter');
            return;
          } else {
            console.log('❌ No business data found');
          }
        } else {
          console.log('❌ Business API failed:', businessRes.status);
        }
        
        // Fallback to entitlements check for Pro
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
        setHasBusiness(false);
        setOnboardingComplete(false);
        return;
      }
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Check business/onboarding status first
      try {
        let businessRes = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers });
        if (!businessRes.ok) {
          businessRes = await fetch('/api/businesses/me', { cache: 'no-store', headers });
        }
        if (businessRes.ok) {
          const businessData = (await businessRes.json().catch(() => null)) as { business?: any } | null;
          const business = businessData?.business;
          const hasBusinessData = Boolean(business);
          const isOnboardingComplete = hasBusinessData && business?.google_place_id;
          
          
          if (!cancelled) {
            setHasBusiness(hasBusinessData);
            setOnboardingComplete(isOnboardingComplete);
          }
        }
      } catch {
        if (!cancelled) {
          setHasBusiness(false);
          setOnboardingComplete(false);
        }
      }

      // Then check plan status
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
      // Also refresh when page becomes visible (user returns from onboarding)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          void refresh();
        }
      });
    } catch {}
    return () => {
      cancelled = true;
      try {
        window.removeEventListener('focus', handleChange);
        window.removeEventListener('idtoken:changed', handleChange as EventListener);
        document.removeEventListener('visibilitychange', () => {
          if (!document.hidden) {
            void refresh();
          }
        });
      } catch {}
    };
  }, []);

  async function handleSubscribeWithPlan(plan: 'monthly' | 'yearly') {
    try {
      if (typeof window !== 'undefined') {
        const desiredHost = (process.env.NEXT_PUBLIC_APP_HOST || 'app.reviewsandmarketing.com').toLowerCase();
        const currentHost = window.location.hostname.toLowerCase();
        const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
        if (!isLocal && currentHost !== desiredHost) {
          const params = new URLSearchParams();
          params.set('plan', plan);
          params.set('from', currentHost);
          window.location.href = `https://${desiredHost}/pricing?${params.toString()}`;
          return;
        }
      }

      setError(null);
      setProError(null);
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
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Stripe checkout failed:', res.status, errorText);
        console.log('About to throw error with message:', `Checkout failed (${res.status}): ${errorText}`);
        throw new Error(`Checkout failed (${res.status}): ${errorText || 'Unknown error'}`);
      }
      
      const j = await res.json().catch(() => null);
      console.log('Stripe checkout response:', j);
      
      try { if (j?.id) localStorage.setItem('stripe:lastSessionId', String(j.id)); } catch {}
      
      if (j?.url) {
        console.log('Redirecting to Stripe checkout:', j.url);
        try {
          window.location.assign(j.url);
        } catch {
          window.location.href = j.url;
        }
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Checkout failed";
      console.error('Pro upgrade error:', e);
      console.log('Setting error state to:', message);
      setError(message);
      setProError(message);
      console.log('Error state set, will clear in 5 seconds');
      // Show error for 5 seconds
      setTimeout(() => {
        console.log('Clearing error state after timeout');
        setError(null);
        setProError(null);
      }, 5000);
    } finally {
      setProLoading(false);
    }
  }

  async function openBillingPortal() {
    console.log('[BILLING PORTAL] Starting billing portal request');
    try {
      setError(null);
      setProError(null);
      setProLoading(true);
      console.log('[BILLING PORTAL] Loading state set to true');
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('idToken') || '';
        if (token) headers.Authorization = `Bearer ${token}`;
        console.log('[BILLING PORTAL] Headers prepared:', { hasToken: !!token });
      } catch {}
      
      console.log('[BILLING PORTAL] Making fetch request to /api/stripe/portal');
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ idToken: (typeof localStorage !== 'undefined' ? localStorage.getItem('idToken') : '') || undefined })
      });
      
      console.log('[BILLING PORTAL] Response status:', res.status);
      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        console.error('[BILLING PORTAL] Request failed:', res.status, text);
        throw new Error(text || 'Unable to open billing portal');
      }
      
      const j = await res.json();
      console.log('[BILLING PORTAL] Response data:', j);
      
      if (j?.url) {
        console.log('[BILLING PORTAL] Opening URL:', j.url);
        try {
          const w = window.open(j.url, '_blank', 'noopener,noreferrer');
          if (!w) {
            console.warn('[BILLING PORTAL] Popup blocked, redirecting in same tab');
            window.location.href = j.url;
          } else {
            console.log('[BILLING PORTAL] Successfully opened in new tab');
          }
        } catch (err) {
          console.error('[BILLING PORTAL] Error opening window:', err);
          window.location.href = j.url;
        }
        return;
      }
      throw new Error('No URL returned from billing portal');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to open billing portal';
      console.error('[BILLING PORTAL] Error:', message);
      // Scope the error to the Pro card UI
      if (/stripe customer not found/i.test(message)) {
        setProError('Stripe customer not found. Start a Pro checkout once to initialize billing, then return here.');
      } else {
        setProError(message);
      }
    } finally {
      console.log('[BILLING PORTAL] Setting loading state to false');
      setProLoading(false);
    }
  }

  async function cancelStarterPlan() {
    if (!confirm('Are you sure you want to cancel your Starter plan? This will stop your review request allocations.')) {
      return;
    }
    
    try {
      setStarterLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('idToken') || '';
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch('/api/plan/cancel', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (j?.success) {
        setMessage('✅ Starter plan cancelled successfully');
        setMessageType('success');
        setPlanStatus('none');
        setHasPlan(false);
        setIsPro(false);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (j?.redirectToPortal) {
        await openBillingPortal();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to cancel subscription';
      setError(message);
    } finally {
      setStarterLoading(false);
    }
  }

  async function handleProCta() {
    console.log('[PRO CTA] handleProCta called', { proLoading, authed, planStatus, isPro });
    if (proLoading) {
      console.log('[PRO CTA] Already loading, returning');
      return;
    }
    if (authed && planStatus === 'loading') {
      console.log('[PRO CTA] Plan status loading, returning');
      return;
    }
    if (isPro) {
      console.log('[PRO CTA] User is Pro, opening billing portal');
      await openBillingPortal();
    } else {
      console.log('[PRO CTA] User not Pro, starting subscription');
      await handleSubscribeWithPlan(billing);
    }
  }

  async function handleStarterCta() {
    if (!authed) {
      window.location.href = '/register';
      return;
    }
    if (planStatus === 'starter' && onboardingComplete) {
      window.location.href = '/dashboard';
      return;
    }
    if ((planStatus === 'starter' || selectedPlanFromStorage === 'starter') && !onboardingComplete) {
      window.location.href = '/onboarding/business';
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

      // Refresh onboarding state after plan activation
      try {
        const headersAuth: Record<string, string> = {};
        if (headers.Authorization) headersAuth.Authorization = headers.Authorization;
        let businessRes = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers: headersAuth });
        if (!businessRes.ok && headersAuth.Authorization) {
          businessRes = await fetch('/api/businesses/me', { cache: 'no-store', headers: headersAuth });
        }
        if (businessRes.ok) {
          const businessData = (await businessRes.json().catch(() => null)) as { business?: any } | null;
          const business = businessData?.business;
          const hasBusinessData = Boolean(business);
          const isOnboardingComplete = hasBusinessData && business?.google_place_id;
          
          setHasBusiness(hasBusinessData);
          setOnboardingComplete(isOnboardingComplete);
        }
      } catch {
        // Keep defaults if business check fails
        setHasBusiness(false);
        setOnboardingComplete(false);
      }

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
      
      // Show success message before redirect
      setError(null);
      setMessage('✅ Starter plan activated! Redirecting to setup...');
      setMessageType('success');
      
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, redirectTarget === '/dashboard' ? 400 : 1500);
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
      : starterActive && onboardingComplete
        ? 'Current Plan'
        : (starterActive || selectedPlanFromStorage === 'starter') && !onboardingComplete
          ? 'Complete Setup'
          : isPro
            ? 'Go to Dashboard'
            : authed
              ? 'Activate Starter'
              : 'Get Started Free';

  const starterDisabled = planChecking || starterLoading || (starterActive && onboardingComplete);
  const proCtaLabel = planChecking
    ? 'Checking plan...'
    : proLoading
      ? 'Processing...'
      : isPro
        ? 'Manage Billing'
        : starterActive
          ? billing === 'monthly'
            ? 'Upgrade to Pro (Monthly)'
            : 'Upgrade to Pro (Yearly)'
          : billing === 'monthly'
            ? 'Start Pro (Monthly)'
            : 'Start Pro (Yearly)';
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-indigo-700 shadow-lg">Starter is free • Upgrade anytime</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 md:text-xl">
            Everything you need to collect more reviews, nurture customer trust, and measure the impact.
          </p>
          {/* Current Plan Status */}
          {authed && (planStatus !== 'loading' && planStatus !== 'none' || selectedPlanFromStorage) && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You're on the {(planStatus === 'starter' || selectedPlanFromStorage === 'starter') ? 'Starter' : 'Pro'} plan {(planStatus === 'starter' || selectedPlanFromStorage === 'starter') ? '– free forever' : '– unlimited features'}
            </div>
          )}
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
            {billing === 'yearly' && (
              <span className="hidden sm:inline rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Save 17% vs monthly</span>
            )}
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
            <div className={`rounded-3xl border p-8 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl ${
              starterActive ? 'border-emerald-300 bg-emerald-50/50' : 'border-white/70 bg-white/85'
            }`}>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-2xl font-semibold text-slate-900">Starter</h3>
                  {(starterActive || selectedPlanFromStorage === 'starter') && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      Current Plan
                    </span>
                  )}
                </div>
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
              {message && (
                <div className={`mt-4 p-3 border rounded-lg ${
                  messageType === 'success' ? 'bg-green-50 border-green-200' :
                  messageType === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    messageType === 'success' ? 'text-green-600' :
                    messageType === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>{message}</p>
                </div>
              )}
              
              {/* Subscription Management for Starter Plan */}
              {authed && starterActive && onboardingComplete && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-3">Manage your Starter plan</p>
                    <button
                      onClick={cancelStarterPlan}
                      disabled={starterLoading}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {starterLoading ? 'Cancelling...' : 'Cancel Starter plan'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pro Plan - Featured */}
            <div className={`relative rounded-3xl border p-8 shadow-2xl backdrop-blur transition hover:-translate-y-1 ${
              isPro ? 'border-emerald-300 bg-emerald-50/50 shadow-emerald-500/20' : 'border-indigo-300 bg-white/90 shadow-indigo-500/20'
            }`}>
              <div className="absolute -top-5 left-1/2 w-max -translate-x-1/2">
                <span className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white ${
                  isPro ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                }`}>
                  {(isPro || selectedPlanFromStorage === 'pro') ? 'Current Plan' : 'Most Popular'}
                </span>
              </div>
              
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-2xl font-semibold text-slate-900">Pro</h3>
                  {isPro && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  )}
                </div>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[PRICING] Pro button clicked');
                  handleProCta();
                }}
                disabled={proLoading || planChecking}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {proLoading ? "Processing…" : proCtaLabel}
              </button>
            {proError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{proError}</p>
              </div>
            )}
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
            Start growing your online reputation today. Get started free and upgrade anytime.
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
