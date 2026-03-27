'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, User } from 'firebase/auth';
import { resolveRoute } from '@/lib/resolveRoute';

export default function SelectPlanPage() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const firebaseUserRef = useRef<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        router.replace('/login?redirect=/select-plan');
        return;
      }
      await user.reload();
      if (!user.emailVerified) {
        router.replace('/verify-email');
        return;
      }
      firebaseUserRef.current = user;

      try {
        const token = await user.getIdToken();
        const dest = await resolveRoute(token);
        // Only show select-plan UI if resolveRoute says so
        if (dest !== '/select-plan') {
          router.replace(dest);
          return;
        }
      } catch {
        router.replace('/dashboard');
        return;
      }

      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handlePlanSelect = async (plan: 'starter' | 'pro') => {
    setLoading(true);
    setSelectedPlan(plan);
    setError(null);
    
    try {
      const fbUser = firebaseUserRef.current;
      if (!fbUser) {
        router.replace('/login?redirect=/select-plan');
        return;
      }

      const token = await fbUser.getIdToken();
      localStorage.setItem('selectedPlan', plan);
      
      if (plan === 'pro') {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            successUrl: `${window.location.origin}/onboarding/business?plan=pro`,
            cancelUrl: `${window.location.origin}/select-plan`,
          }),
        });
        
        if (response.ok) {
          const { url } = await response.json();
          window.location.href = url;
          return;
        }

        setError('Failed to start checkout. Please try again.');
        setLoading(false);
        setSelectedPlan(null);
        return;
      }
      
      const res = await fetch('/api/plan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: 'starter' }),
        credentials: 'include',
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Unknown error');
        console.error('[select-plan] plan/start failed:', res.status, msg);
        setError('Failed to activate plan. Please try again.');
        setLoading(false);
        setSelectedPlan(null);
        return;
      }

      router.push('/onboarding/business?plan=starter');
    } catch (err) {
      console.error('[select-plan] Error selecting plan:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-surface flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Preparing your plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-container-lowest flex flex-col items-center justify-center py-20 px-6">
      <div className="max-w-5xl w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-16 px-2 max-w-md mx-auto">
          {[
            { label: 'Register', status: 'complete' },
            { label: 'Verify', status: 'complete' },
            { label: 'Plan', status: 'active' },
            { label: 'Setup', status: 'pending' }
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step.status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white' :
                step.status === 'active' ? 'bg-surface border-primary text-primary shadow-lg shadow-primary/20' :
                'bg-surface border-outline-variant/20 text-on-surface-variant/60'
              }`}>
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === 'active' ? 'text-brand' : 'text-on-surface-variant/60'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            Step 3 of 4
          </div>
          <h1 className="text-4xl font-black text-on-surface mb-4 tracking-tight">Select Your Growth Plan</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto font-medium">
            Choose the best way to scale your reputation. You can upgrade or cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
          {/* Background decoration */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Starter Plan */}
          <div className="relative bg-surface rounded-[40px] border-2 border-outline-variant/20 p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col group">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-6 group-hover:bg-slate-200 transition-colors">
                Starter
              </div>
              <div className="mb-4">
                <span className="text-5xl font-black text-on-surface tracking-tighter">Free</span>
                <span className="text-on-surface-variant/60 ml-2 font-bold uppercase text-xs tracking-widest">forever</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                Perfect for local operators getting started with reputation management.
              </p>
            </div>
            
            <div className="flex-1">
              <ul className="space-y-4 mb-10">
                {[
                  '5 review requests per month',
                  'Branded QR code generator',
                  'Google Maps integration',
                  'Basic dashboard analytics',
                  'Smart review filtering'
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-on-surface-variant font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => handlePlanSelect('starter')}
              disabled={loading}
              className="w-full h-14 bg-inverse-surface text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-outline-variant/20"
            >
              {loading && selectedPlan === 'starter' ? 'Setting up...' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-surface rounded-[40px] border-2 border-primary/20 p-10 shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-1 flex flex-col group overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-brand text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest transform rotate-45 translate-x-8 translate-y-2 shadow-lg">
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/10">
                Professional
              </div>
              <div className="mb-4">
                <span className="text-5xl font-black text-on-surface tracking-tighter">$49.99</span>
                <span className="text-on-surface-variant/60 ml-2 font-bold uppercase text-xs tracking-widest">/mo</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                For growing businesses that need unlimited reviews and POS automation.
              </p>
            </div>
            
            <div className="flex-1">
              <ul className="space-y-4 mb-10">
                {[
                  'Unlimited review requests',
                  'Square POS automation',
                  'Advanced analytics & trends',
                  'Lead generation & export',
                  'Priority support',
                  'Custom email templates'
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-on-surface-variant font-medium">
                    <div className="w-5 h-5 rounded-full bg-brand/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => handlePlanSelect('pro')}
              disabled={loading}
              className="w-full h-14 bg-brand text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-brand-hover transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/30"
            >
              {loading && selectedPlan === 'pro' ? 'Redirecting...' : 'Go Pro Now'}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
            <p className="text-sm text-red-600 font-bold">{error}</p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-sm text-on-surface-variant/60 font-medium">
            Need a custom enterprise plan?{' '}
            <Link href="/contact" className="text-brand font-black hover:underline uppercase tracking-widest ml-1">
              Contact Sales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
