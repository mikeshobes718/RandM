"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/r/')) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <HeaderInner />
    </Suspense>
  );
}

function HeaderInner() {
  const [authed, setAuthed] = useState(false);
  const [pro, setPro] = useState<boolean | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [ctaLoading, setCtaLoading] = useState(false);
  const [hasBusiness, setHasBusiness] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  void searchParams;

  const navLinks = useMemo(() => {
    const activePath = pathname?.split('?')[0] ?? '/';
    return NAV_LINKS.map((link) => {
      const normalized = link.href === '/' ? '/' : link.href.replace(/\/?$/, '/');
      const isActive = activePath === link.href || (normalized !== '/' && activePath.startsWith(normalized));
      return { ...link, active: isActive };
    });
  }, [pathname]);

  const handleDashboardClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      if (emailVerified === false) {
        ev.preventDefault();
        window.location.href = '/verify-email?next=/dashboard';
      }
    } catch {}
  };

  useEffect(() => {
    try {
      if (document.cookie.split(';').some(c => c.trim().startsWith('onboarding_complete=1'))) {
        setHasBusiness(true);
      }
    } catch {}
    async function refresh() {
      try {
        setAuthed(Boolean(localStorage.getItem('idToken')));
        setEmail(localStorage.getItem('userEmail') || '');
      } catch { setAuthed(false); setEmail(''); }
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          setAuthed(true);
          if (j?.email) setEmail(j.email);
          if (typeof j?.emailVerified === 'boolean') setEmailVerified(j.emailVerified);
        } else {
          setEmailVerified(null);
        }
      } catch { setEmailVerified(null); }
      try {
        const r = await fetch('/api/entitlements', { cache: 'no-store' });
        if (r.ok) { const j = await r.json(); setPro(Boolean(j?.pro)); }
      } catch { setPro(null); }
      try {
        const r2 = await fetch('/api/plan/status', { cache: 'no-store' });
        if (r2.ok) { const j2 = await r2.json(); setPlanStatus(j2?.status || null); }
      } catch {}
      try {
        let ok = false;
        let j3: { business?: unknown } | null = null;
        const tok = localStorage.getItem('idToken') || '';
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        let r3: Response | null = null;
        try { r3 = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers }); } catch {}
        if (r3 && r3.ok) { ok = true; j3 = await r3.json().catch(() => null); }
        if (!ok) {
          try {
            r3 = await fetch('/api/businesses/me', { cache: 'no-store', headers });
            if (r3.ok) { ok = true; j3 = await r3.json().catch(() => null); }
          } catch {}
        }
        setHasBusiness(ok && Boolean(j3?.business));
      } catch { setHasBusiness(false); }
    }
    void refresh();
    const onChanged = () => { void refresh(); };
    window.addEventListener('idtoken:changed', onChanged as EventListener);
    window.addEventListener('focus', onChanged);
    window.addEventListener('storage', (e: Event) => {
      const ev = e as StorageEvent;
      if (ev.key === 'idToken') onChanged();
    });
    return () => {
      window.removeEventListener('idtoken:changed', onChanged as EventListener);
      window.removeEventListener('focus', onChanged);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    try {
      if (typeof document === 'undefined') return;
      if (menuOpen) {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
      }
    } catch {}
    return () => {};
  }, [menuOpen]);

  const planChip = useMemo(() => {
    if (!authed) return null;
    const status = (planStatus || '').toLowerCase();
    if (pro === true || status === 'active' || status === 'trialing') {
      return {
        label: 'Pro',
        className: 'border-emerald-500/40 bg-emerald-50 text-emerald-600',
      };
    }
    if (status === 'starter') {
      return {
        label: 'Starter',
        className: 'border-slate-300/70 bg-white/70 text-slate-600',
      };
    }
    if (status && status !== 'none') {
      return {
        label: status.replace(/_/g, ' '),
        className: 'border-amber-400/60 bg-amber-50 text-amber-700',
      };
    }
    return null;
  }, [authed, planStatus, pro]);

  const desktopCta = useMemo(() => {
    const signOutButton = (
      <button
        type="button"
        onClick={() => { void logout(); }}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:bg-slate-50"
      >
        Log out
      </button>
    );

    if (!authed) {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-purple-400"
          >
            Create account
          </Link>
        </div>
      );
    }
    if (authed && (pro === true || hasBusiness || planStatus === 'starter')) {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            onClick={handleDashboardClick}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:from-violet-400 hover:to-indigo-400"
          >
            Dashboard
          </Link>
          {signOutButton}
        </div>
      );
    }
    if (authed && !hasBusiness && pro === false) {
      return (
        <div className="flex items-center gap-3">
          {planStatus === 'none' ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Choose a plan
            </Link>
          ) : (
            <button
              onClick={() => void startCheckout('monthly', setCtaLoading)}
              disabled={ctaLoading}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-400/40 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {ctaLoading ? 'Processing…' : 'Upgrade to Pro'}
            </button>
          )}
          {signOutButton}
        </div>
      );
    }
    return signOutButton;
  }, [authed, pro, hasBusiness, planStatus, ctaLoading]);

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/90 via-white/70 to-transparent backdrop-blur-lg" aria-hidden="true" />
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 rounded-full border border-slate-100/60 bg-white/80 px-3 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-lg transition hover:-translate-y-0.5 hover:shadow-xl">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 shadow-lg shadow-violet-500/25">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <svg aria-hidden className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">Reviews & Marketing</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Reputation Toolkit</span>
          </div>
          {planChip && (
            <span className={`ml-2 hidden items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:inline-flex ${planChip.className}`}>
              {planChip.label}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-slate-100/70 bg-white/70 px-2 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-xl md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${link.active ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'}`}
            >
              {link.label}
              {link.active && (
                <span className="absolute inset-x-3 -bottom-[10px] h-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" aria-hidden="true" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center md:gap-3">
          {authed && email && (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5"
              title={email}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {email.slice(0, 1).toUpperCase()}
              </span>
              {email}
            </span>
          )}
          {desktopCta}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-md shadow-slate-900/10 backdrop-blur md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-950/70 backdrop-blur md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/40" />
          <div
            className="mt-auto w-full rounded-t-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 px-6 pb-10 pt-6 shadow-[0_-20px_60px_rgba(15,23,42,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Menu</div>
              {email && <div className="text-xs text-white/60">Signed in as {email}</div>}
            </div>
            <div className="mt-6 space-y-6">
              <div className="grid gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-base font-medium transition ${link.active ? 'bg-white text-slate-900 shadow-lg shadow-slate-900/50' : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>{link.label}</span>
                    {link.active && (
                      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" aria-hidden="true" />
                    )}
                  </Link>
                ))}
              </div>

              <div className="grid gap-3">
                {!authed && (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:-translate-y-0.5 hover:bg-slate-100"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:-translate-y-0.5"
                    >
                      Create account
                    </Link>
                  </>
                )}

                {authed && (pro === true || hasBusiness) && (
                  <Link
                    href="/dashboard"
                    onClick={(e) => {
                      handleDashboardClick(e);
                      setMenuOpen(false);
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/40"
                  >
                    Continue to Dashboard
                  </Link>
                )}

                {authed && !hasBusiness && pro === false && (
                  planStatus === 'none' ? (
                    <Link
                      href="/pricing"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-base font-medium text-white/90 hover:bg-white/10 transition"
                    >
                      Choose a plan
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        void startCheckout('monthly', setCtaLoading);
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-amber-500/40"
                    >
                      {ctaLoading ? 'Processing…' : 'Upgrade to Pro'}
                    </button>
                  )
                )}

                {authed && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/50 transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Log out
                  </button>
                )}
              </div>

              {landingCtas(navLinks, authed, hasBusiness, pro)}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function landingCtas(
  navLinks: Array<{ href: string; label: string; active?: boolean }>,
  authed: boolean,
  hasBusiness: boolean,
  pro: boolean | null,
) {
  const showDashboardShortcut = authed && (hasBusiness || pro === true);
  if (!showDashboardShortcut) return null;
  const hasDashboardLink = navLinks.some((link) => link.href === '/dashboard');
  if (hasDashboardLink) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
      <div className="font-semibold uppercase tracking-[0.3em] text-white/60">Quick access</div>
      <div className="mt-3 grid gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40"
        >
          Dashboard
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function getBillingPref(): 'monthly' | 'yearly' {
  try { const v = localStorage.getItem('billingPreference'); if (v === 'yearly' || v === 'monthly') return v; } catch {}
  return 'monthly';
}

async function startCheckout(plan: 'monthly' | 'yearly', setLoading: (v: boolean) => void) {
  try {
    setLoading(true);
    const chosen = plan || getBillingPref();
    let payload: { plan: 'monthly' | 'yearly'; uid?: string; email?: string } = { plan: chosen };
    try {
      const hasToken = Boolean(localStorage.getItem('idToken'));
      if (!hasToken) {
        let em = localStorage.getItem('userEmail') || '';
        if (!em) {
          const entered = window.prompt('Enter your email for checkout:') || '';
          if (!entered) throw new Error('Email is required to continue');
          em = entered;
        }
        payload = { plan: chosen, uid: 'anon', email: em };
      }
    } catch {}
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    const j = await res.json();
    try { if (j?.id) localStorage.setItem('stripe:lastSessionId', String(j.id)); } catch {}
    if (j?.url) {
      window.location.href = j.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    window.alert(message);
  } finally {
    setLoading(false);
  }
}

async function logout() {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  try { localStorage.removeItem('idToken'); localStorage.removeItem('userEmail'); } catch {}
  window.location.href = '/';
}
