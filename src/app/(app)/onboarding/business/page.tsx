"use client";
import BusinessSetupForm from "@/components/onboarding/BusinessSetupForm";
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { resolveRoute } from '@/lib/resolveRoute';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEditMode = searchParams?.get('edit') === '1';
  const [loading, setLoading] = useState(!isEditMode);

  useEffect(() => {
    if (isEditMode) return;

    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        router.replace('/login?redirect=/onboarding/business');
        return;
      }

      try {
        const token = await user.getIdToken();
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };

        const dest = await resolveRoute(token);
        // Only stay on onboarding if resolveRoute says so
        if (dest !== '/onboarding/business') {
          router.replace(dest);
          return;
        }
      } catch (err) {
        console.error('[onboarding] Failed to check status:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isEditMode, router]);

  if (loading) {
    return (
      <div className="w-full max-w-xl flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Verifying plan status...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Step Indicator */}
      {!isEditMode && (
        <div className="flex items-center justify-between mb-16 px-2 max-w-md mx-auto">
          {[
            { label: 'Register', status: 'complete' },
            { label: 'Verify', status: 'complete' },
            { label: 'Plan', status: 'complete' },
            { label: 'Setup', status: 'active' }
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step.status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white' :
                step.status === 'active' ? 'bg-surface border-brand text-brand shadow-lg shadow-brand/20' :
                'bg-surface border-outline-variant/30 text-on-surface-variant/60'
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
      )}

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-6">
          {isEditMode ? 'Settings' : 'Final Step'}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-on-surface leading-tight mb-3">
          {isEditMode ? 'Business Details' : 'Connect Your Business'}
        </h1>
        <p className="text-on-surface-variant font-medium max-w-sm mx-auto leading-relaxed">
          {isEditMode 
            ? 'Update your business information and review link.' 
            : 'Search for your business on Google to automatically sync your review link and details.'}
        </p>
      </div>

      <div className="surface-card p-10 rounded-[40px] shadow-2xl shadow-outline-variant/20 bg-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
        <BusinessSetupForm />
      </div>

      {!isEditMode && (
        <div className="mt-12 text-center">
          <p className="text-xs text-on-surface-variant/60 font-medium">
            Having trouble? <Link href="/contact" className="text-brand font-black hover:underline uppercase tracking-widest ml-1">Contact Support</Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function OnboardingBusinessPage() {
  return (
    <main className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center py-20 px-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      }>
        <OnboardingContent />
      </Suspense>
    </main>
  );
}
