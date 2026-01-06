"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [midLoading, setMidLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [authed, setAuthed] = useState(false);
  const [planStatus, setPlanStatus] = useState<'loading' | 'none' | string>('loading');
  const [currentTier, setCurrentTier] = useState<'starter' | 'mid' | 'pro' | 'none'>('none');

  useEffect(() => {
    const checkAuthAndPlan = async () => {
      try {
        const token = localStorage.getItem('idToken');
        setAuthed(Boolean(token));
        
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/plan/status', { cache: 'no-store', headers });
        if (res.ok) {
          const data = await res.json();
          const status = (data.status || 'none').toLowerCase();
          const planId = data.plan_id;
          
          setPlanStatus(status);
          
          if (status === 'active' || status === 'trialing') {
            const pid = (planId || '').toLowerCase();
            if (pid.includes('mid') || pid.includes('small-business')) {
              setCurrentTier('mid');
            } else {
              setCurrentTier('pro');
            }
          } else if (status === 'starter') {
            setCurrentTier('starter');
          } else {
            setCurrentTier('none');
          }
          
          setHasPlan(status !== 'none');
        } else {
          setPlanStatus('none');
          setCurrentTier('none');
        }
      } catch {
        setPlanStatus('none');
        setCurrentTier('none');
      }
    };
    checkAuthAndPlan();
  }, []);

  const handleCheckout = async (tier: 'mid' | 'pro') => {
    if (currentTier === tier) {
      window.location.href = '/settings';
      return;
    }
    
    if (tier === 'mid') setMidLoading(true);
    else setProLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing, tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to start checkout.");
    } finally {
      setMidLoading(false);
      setProLoading(false);
    }
  };

  const handleStarterCta = async () => {
    if (!authed) {
      window.location.href = '/register';
      return;
    }
    if (currentTier === 'starter' || currentTier === 'mid' || currentTier === 'pro') {
      window.location.href = '/dashboard';
      return;
    }
    setMidLoading(true); // Reuse midLoading for starter activation
    try {
      const res = await fetch('/api/plan/start', { method: 'POST' });
      if (res.ok) window.location.href = '/onboarding/business';
    } catch {
      setError("Failed to activate Starter.");
    } finally {
      setMidLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black tracking-tight mb-4">Simple Pricing</h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Choose the plan that fits your business. Start free, upgrade anytime.
          </p>
          
          <div className="mt-10 inline-flex items-center p-1 bg-accent rounded-xl border border-border">
            <button 
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${billing === 'monthly' ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${billing === 'yearly' ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Yearly <span className="text-[10px] text-emerald-600 ml-1">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Card */}
          <div className="premium-card p-8 rounded-3xl flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-sm text-muted">Perfect for solo operators.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black">$0</span>
              <span className="text-muted ml-2">free forever</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {['5 Review Requests / mo', '1 Smart QR Code', 'Basic Analytics', 'Email Support'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={handleStarterCta}
              disabled={midLoading || currentTier !== 'none'}
              className="secondary-button w-full h-12 disabled:opacity-50"
            >
              {currentTier === 'starter' ? 'Current Plan' : (currentTier !== 'none' ? 'Included' : (midLoading ? '...' : 'Get Started Free'))}
            </button>
          </div>

          {/* Mid Tier Card */}
          <div className="premium-card p-8 rounded-3xl flex flex-col border-brand/20 shadow-xl shadow-brand/5 relative">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold mb-2">Small Business</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 px-2 py-1 rounded">Growth</span>
              </div>
              <p className="text-sm text-muted">For expanding teams.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black">{billing === 'monthly' ? '$29.99' : '$24.99'}</span>
              <span className="text-muted ml-2">{billing === 'monthly' ? '/mo' : '/mo billed yearly'}</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {['50 Review Requests / mo', '5 Smart QR Codes', 'Square Integration', 'Standard Email Support'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium">
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleCheckout('mid')}
              disabled={midLoading || currentTier === 'mid' || currentTier === 'pro'}
              className="primary-button w-full h-12 disabled:opacity-50"
            >
              {currentTier === 'mid' ? 'Current Plan' : (currentTier === 'pro' ? 'Included in Unlimited' : (midLoading ? '...' : 'Select Plan'))}
            </button>
          </div>

          {/* Pro Card */}
          <div className="premium-card p-8 rounded-3xl flex flex-col border-brand/50 ring-4 ring-brand/5 !bg-slate-900 !text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
            <div className="mb-8 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold mb-2">Unlimited</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-brand px-2 py-1 rounded shadow-lg shadow-brand/20">Recommended</span>
              </div>
              <p className="text-sm text-slate-400">Total control & scale.</p>
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-4xl font-black">{billing === 'monthly' ? '$49.99' : '$39.99'}</span>
              <span className="text-slate-400 ml-2">{billing === 'monthly' ? '/mo' : '/mo billed yearly'}</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              {['Unlimited Requests', 'Unlimited QR Codes', 'All Integrations', 'Priority Support', 'Advanced Reporting'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium">
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="relative z-10 mt-auto">
              <button 
                onClick={() => handleCheckout('pro')}
                disabled={proLoading || currentTier === 'pro'}
                className="primary-button !bg-white !text-slate-900 w-full h-12 disabled:opacity-50 font-black shadow-xl shadow-brand/20"
              >
                {currentTier === 'pro' ? 'Current Plan' : (proLoading ? '...' : 'Go Unlimited')}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-6 text-center text-sm text-red-600 font-medium">{error}</p>}

        {/* FAQ Teaser */}
        <div className="mt-24 pt-24 border-t border-border">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold mb-3">Cancel anytime?</h4>
              <p className="text-sm text-muted leading-relaxed">Yes, no long-term contracts. You can cancel your subscription with a single click in settings.</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Is it really free?</h4>
              <p className="text-sm text-muted leading-relaxed">The Starter plan is 100% free forever. No credit card required to get started.</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Custom needs?</h4>
              <p className="text-sm text-muted leading-relaxed">For enterprise features or multi-location setups (&gt;10), please <a href="/contact" className="text-brand hover:underline">contact our sales team</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
