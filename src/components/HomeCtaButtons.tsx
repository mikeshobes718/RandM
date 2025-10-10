"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Alignment = "center" | "start";
type Variant = "full" | "hero";

interface HomeCtaButtonsProps {
  align?: Alignment;
  variant?: Variant;
}

export default function HomeCtaButtons({ align = "center", variant = "full" }: HomeCtaButtonsProps) {
  const [authed, setAuthed] = useState(false);
  const [pro, setPro] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage for idToken
        const idToken = localStorage.getItem('idToken');
        const isAuthenticated = Boolean(idToken);
        setAuthed(isAuthenticated);
        
        // Only check entitlements if authenticated
        if (isAuthenticated) {
          try {
            const response = await fetch('/api/entitlements');
            if (response.ok) {
              const data = await response.json();
              setPro(Boolean(data?.pro));
            }
          } catch (error) {
            console.log('Entitlements check failed:', error);
            setPro(null);
          }
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const alignmentClass = align === "start"
    ? "justify-center sm:justify-start"
    : "justify-center";

  // Hero variant: Only show primary CTA
  if (variant === "hero") {
    return (
      <div className={`flex flex-col sm:flex-row gap-4 ${alignmentClass}`}>
        <Link
          href={authed ? '/dashboard' : '/register'}
          className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {loading ? 'Loading...' : (authed ? 'Open dashboard' : 'Get Started Free')}
          <svg aria-hidden className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        {!loading && !authed && (
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-6 py-3 text-sm text-slate-700 font-medium rounded-xl hover:text-indigo-600 transition-all duration-200"
          >
            Already have an account? <span className="ml-1 underline">Sign in</span>
          </Link>
        )}
      </div>
    );
  }

  // Full variant: Show all CTAs
  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-4 ${alignmentClass}`}>
        <Link
          href={authed ? '/dashboard' : '/register'}
          className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {loading ? 'Loading...' : (authed ? 'Open dashboard' : 'Get Started Free')}
          <svg aria-hidden className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        {!loading && !authed && (
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Sign in
          </Link>
        )}
        {!loading && authed && pro === false && (
          <Link 
            href="/pricing" 
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
    </>
  );
}
