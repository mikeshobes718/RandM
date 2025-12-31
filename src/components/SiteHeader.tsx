"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SiteHeader() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const r = await fetch('/api/auth/me');
        if (r.ok) {
          const j = await r.json();
          const user = j?.user || j;
          setAuthed(true);
          if (user?.email) setEmail(user.email);
          if (typeof user?.emailVerified === 'boolean') setEmailVerified(user.emailVerified);
        } else {
          setAuthed(false);
          setEmail(null);
        }
      } catch (err) {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      setAuthed(false);
      setEmail(null);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tighter text-brand">R&M</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-muted hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted hover:text-foreground transition-colors">Pricing</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-accent" />
          ) : authed ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="primary-button !h-9 !px-4 !text-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
