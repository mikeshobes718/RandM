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
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setAuthed(true);
          const entRes = await fetch('/api/entitlements');
          if (entRes.ok) {
            const entData = await entRes.json();
            setPro(Boolean(entData?.pro));
          }
        } else {
          setAuthed(false);
          setPro(null);
          localStorage.removeItem('idToken');
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

  const alignmentClass = align === "start" ? "justify-center sm:justify-start" : "justify-center";

  if (variant === "hero") {
    return (
      <div className={`flex flex-col sm:flex-row gap-4 items-center ${alignmentClass}`}>
        <Link
          href={authed ? '/dashboard' : '/register'}
          className="primary-button h-12 px-8 text-sm font-semibold gap-2"
        >
          {loading ? 'Loading...' : (authed ? 'Open Dashboard' : 'Get Started Free')}
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
        {!loading && !authed && (
          <Link
            href="/login"
            className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Already have an account? <span className="text-primary hover:underline">Sign in</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center ${alignmentClass}`}>
      <Link
        href={authed ? '/dashboard' : '/register'}
        className="primary-button h-12 px-8 text-sm font-semibold gap-2"
      >
        {loading ? 'Loading...' : (authed ? 'Open Dashboard' : 'Get Started Free')}
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
      </Link>
      {!loading && !authed && (
        <Link href="/login" className="secondary-button h-12 px-8 text-sm font-semibold">
          Sign in
        </Link>
      )}
      {!loading && authed && pro === false && (
        <Link href="/pricing" className="secondary-button h-12 px-8 text-sm font-semibold">
          Upgrade to Pro
        </Link>
      )}
    </div>
  );
}
