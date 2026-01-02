'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

export default function SelectPlanPage() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null);
  const router = useRouter();

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

      // Check if they already have a plan to skip this step
      try {
        const res = await fetch('/api/plan/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status !== 'none') {
            // Already have a plan, check if they also have a business
            const bizRes = await fetch('/api/businesses/me');
            if (bizRes.ok) {
              const bizData = await bizRes.json();
              if (bizData.business?.google_place_id) {
                router.replace('/dashboard');
              } else {
                router.replace('/onboarding/business');
              }
              return;
            }
          }
        }
      } catch (err) {
        console.error('Plan check error:', err);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handlePlanSelect = async (plan: 'starter' | 'pro') => {
    setLoading(true);
    setSelectedPlan(plan);
    
    try {
      // Store selected plan in localStorage for the onboarding flow
      localStorage.setItem('selectedPlan', plan);
      
      // If Pro plan selected, redirect to Stripe checkout
      if (plan === 'pro') {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
      }
      
      // For Starter plan, proceed directly to business setup
      await fetch('/api/plan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'starter' }),
        credentials: 'include',
      });

      router.push('/onboarding/business?plan=starter');
    } catch (error) {
      console.error('Error selecting plan:', error);
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        <p className="mt-4 text-slate-500 font-medium">Preparing your plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20 px-6">
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
                step.status === 'active' ? 'bg-white border-brand text-brand shadow-lg shadow-brand/20' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === 'active' ? 'text-brand' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-6">
            Step 3 of 4
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Select Your Growth Plan</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Choose the best way to scale your reputation. You can upgrade or cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
          {/* Background decoration */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Starter Plan */}
          <div className="relative bg-white rounded-[40px] border-2 border-slate-100 p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col group">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest mb-6 group-hover:bg-slate-200 transition-colors">
                Starter
              </div>
              <div className="mb-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">Free</span>
                <span className="text-slate-400 ml-2 font-bold uppercase text-xs tracking-widest">forever</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
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
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
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
              className="w-full h-14 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200"
            >
              {loading && selectedPlan === 'starter' ? 'Setting up...' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-white rounded-[40px] border-2 border-brand/20 p-10 shadow-2xl shadow-brand/10 hover:shadow-brand/20 transition-all duration-500 hover:-translate-y-1 flex flex-col group overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-brand text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest transform rotate-45 translate-x-8 translate-y-2 shadow-lg">
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand/5 text-brand text-[10px] font-black uppercase tracking-widest mb-6 border border-brand/10">
                Professional
              </div>
              <div className="mb-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">$49.99</span>
                <span className="text-slate-400 ml-2 font-bold uppercase text-xs tracking-widest">/mo</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
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
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
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
              className="w-full h-14 bg-brand text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-brand-hover transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-brand/30"
            >
              {loading && selectedPlan === 'pro' ? 'Redirecting...' : 'Go Pro Now'}
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-slate-400 font-medium">
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
