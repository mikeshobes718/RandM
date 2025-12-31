"use client";
import BusinessSetupForm from "@/components/onboarding/BusinessSetupForm";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams?.get('edit') === '1';

  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand mb-6 font-bold">
          {isEditMode ? 'Edit' : '1'}
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">
          {isEditMode ? 'Business Details' : 'Connect your business'}
        </h1>
        <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">
          {isEditMode 
            ? 'Update your business information and review link.' 
            : 'Search for your business on Google to automatically sync your review link and details.'}
        </p>
      </div>

      <div className="premium-card p-8 rounded-3xl shadow-xl">
        <BusinessSetupForm />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-muted">
          Secure connection via Google Places API. <br />
          Need help? <a href="/contact" className="text-brand hover:underline font-medium">Contact support</a>
        </p>
      </div>
    </div>
  );
}

export default function OnboardingBusinessPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-6">
      <Suspense fallback={<div className="animate-pulse bg-accent rounded-3xl h-[500px] w-full max-w-xl" />}>
        <OnboardingContent />
      </Suspense>
    </main>
  );
}
