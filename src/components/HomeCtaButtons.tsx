"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Alignment = "center" | "start";

interface HomeCtaButtonsProps {
  align?: Alignment;
}

export default function HomeCtaButtons({ align = "center" }: HomeCtaButtonsProps) {
  const [authed, setAuthed] = useState(false);
  const [pro, setPro] = useState<boolean | null>(null);
  useEffect(() => {
    try { setAuthed(Boolean(localStorage.getItem('idToken'))); } catch {}
    fetch('/api/entitlements')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => setPro(Boolean(j?.pro)))
      .catch(() => setPro(null));
  }, []);

  const alignmentClass = align === "start"
    ? "justify-center sm:justify-start"
    : "justify-center";

  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-4 ${alignmentClass}`}>
        <Link
          href={authed ? '/dashboard' : '/register'}
          className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {authed ? 'Open dashboard' : 'Get Started Free'}
          <svg aria-hidden className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        {!authed && (
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Sign in
          </Link>
        )}
        {authed && pro === false && (
          <Link 
            href="/pricing" 
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
      {/* No extra CTA when authed; header already shows Dashboard for Pro */}
    </>
  );
}
