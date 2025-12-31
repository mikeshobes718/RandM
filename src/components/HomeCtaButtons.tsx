"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Alignment = "center" | "start";
type Variant = "full" | "hero";
type Theme = "light" | "dark";

interface HomeCtaButtonsProps {
  align?: Alignment;
  variant?: Variant;
  theme?: Theme;
}

export default function HomeCtaButtons({ align = "center", variant = "full", theme = "dark" }: HomeCtaButtonsProps) {
  const [authed, setAuthed] = useState(false);
  const [pro, setPro] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const idToken = localStorage.getItem('idToken');
        const isAuthenticated = Boolean(idToken);
        setAuthed(isAuthenticated);

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

  // Using the new global utility classes
  const primaryBtn = "primary-button h-12 px-8";
  const secondaryBtn = "secondary-button h-12 px-8";

  if (variant === "hero") {
    return (
      <div className={`flex flex-col sm:flex-row gap-4 items-center ${alignmentClass}`}>
        <Link
          href={authed ? '/dashboard' : '/register'}
          className={primaryBtn}
        >
          {loading ? 'Loading...' : (authed ? (pro ? 'Open Dashboard' : 'Open Dashboard') : 'Get Started Free')}
          <svg aria-hidden className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        {!loading && !authed && (
          <Link
            href="/login"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Already have an account? <span className="text-brand hover:underline">Sign in</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center ${alignmentClass}`}>
      <Link
        href={authed ? '/dashboard' : '/register'}
        className={primaryBtn}
      >
        {loading ? 'Loading...' : (authed ? 'Open Dashboard' : 'Get Started Free')}
        <svg aria-hidden className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      {!loading && !authed && (
        <Link
          href="/login"
          className={secondaryBtn}
        >
          Sign in
        </Link>
      )}
      {!loading && authed && pro === false && (
        <Link
          href="/pricing"
          className={secondaryBtn}
        >
          Upgrade to Pro
        </Link>
      )}
    </div>
  );
}
