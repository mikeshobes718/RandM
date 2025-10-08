'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SelectPlanPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null);
  const router = useRouter();

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
      router.push('/onboarding/business?plan=starter');
    } catch (error) {
      console.error('Error selecting plan:', error);
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the plan that best fits your business needs. You can always upgrade later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="relative bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Free</span>
                <span className="text-slate-600 ml-2">forever</span>
              </div>
              <p className="text-slate-600 mb-8">
                Perfect for small businesses getting started with review collection.
              </p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">5 review requests per month</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">QR code generator</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Basic analytics dashboard</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Email support</span>
              </li>
            </ul>
            
            <button
              onClick={() => handlePlanSelect('starter')}
              disabled={loading && selectedPlan === 'starter'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && selectedPlan === 'starter' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting up...
                </div>
              ) : (
                'Start Free'
              )}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-white rounded-3xl border-2 border-indigo-200 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                Best Value
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$49.99</span>
                <span className="text-slate-600 ml-2">/month</span>
              </div>
              <p className="text-slate-600 mb-8">
                For growing businesses that need unlimited review collection and advanced features.
              </p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Unlimited review requests</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Advanced analytics & reporting</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Team collaboration tools</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Priority support</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">Custom email templates</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                <span className="text-slate-700">API access</span>
              </li>
            </ul>
            
            <button
              onClick={() => handlePlanSelect('pro')}
              disabled={loading && selectedPlan === 'pro'}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && selectedPlan === 'pro' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redirecting...
                </div>
              ) : (
                'Start Pro Plan'
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Need help choosing?{' '}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
