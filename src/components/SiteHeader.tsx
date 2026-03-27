"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function SiteHeader() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('idToken');
    if (token) {
      setAuthed(true);
      setEmail(localStorage.getItem('userEmail'));
      setLoading(false);
    }

    const unsub = onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        setAuthed(true);
        setEmail(user.email || null);
        setEmailVerified(user.emailVerified);
        setLoading(false);
        user.getIdToken().then(token => {
          localStorage.setItem('idToken', token);
          if (user.email) localStorage.setItem('userEmail', user.email);
        });
        return;
      }
      setAuthed(false);
      setEmail(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await clientAuth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('businessData');
      setAuthed(false);
      setEmail(null);
      setEmailVerified(null);
      router.push('/login?signed_out=1');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isLandingPage = pathname?.startsWith('/r/');
  const isAdminPage = pathname?.startsWith('/admin');
  if (isAuthPage || isLandingPage || isAdminPage) return null;

  const navLinks = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-outline-variant/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg primary-gradient">
              <span className="text-sm font-extrabold text-on-primary">R</span>
            </div>
            <span className="text-base font-extrabold tracking-tight text-on-surface display-font">
              R&M
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-container" />
          ) : authed ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="primary-button !h-9 !px-5 !text-sm !font-semibold !rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
          <MobileMenu authed={authed} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}
