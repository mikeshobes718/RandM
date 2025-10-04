import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('idToken')?.value;

  // Lightweight JWT decode (no signature verification) to read email_verified claim
  const decodeJwt = (tok: string | undefined | null): { email_verified?: boolean } | null => {
    if (!tok) return null;
    try {
      const parts = tok.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString());
      return json;
    } catch {
      return null;
    }
  };

  // Root: gently route users to a meaningful page to avoid any cache edge 404s
  if (pathname === '/' || pathname === '') {
    const url = req.nextUrl.clone();
    // Default landing: dashboard for authed verified users; otherwise send to verify
    if (token) {
      const claims = decodeJwt(token);
      if (claims && claims.email_verified === false) {
        url.pathname = '/verify-email';
        url.searchParams.set('next', '/dashboard');
      } else {
        url.pathname = '/dashboard';
      }
    } else {
      url.pathname = '/verify-email';
      url.searchParams.set('next', '/dashboard');
    }
    return NextResponse.redirect(url);
  }

  // Protect dashboard: be conservative. Only redirect to verify-email if BOTH
  // the cookie's claims say unverified AND the server confirms unverified. If any
  // check is inconclusive, allow navigation (dashboard will also validate).
  // IMPORTANT: Do not block dashboard. We will render a banner inside the app if unverified.
  // This avoids loops when session cookies lag but the client is verified.

  // If user is authenticated and already has a business, bounce onboarding to dashboard
  if (pathname.startsWith('/onboarding')) {
    // Allow navigation unless we can positively determine the email is unverified.
    if (!token) {
      return NextResponse.next();
    }
    try {
      const claims = decodeJwt(token);
      if (claims && claims.email_verified === false) {
        const url = req.nextUrl.clone();
        url.pathname = '/verify-email';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
    } catch {}
    // Allow explicit edit mode to reach onboarding - this is the key fix
    if (req.nextUrl.searchParams.get('edit') === '1') {
      return NextResponse.next();
    }
    try {
      const r = await fetch(`${req.nextUrl.origin}/api/businesses/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Also forward cookie so API can use session cookie pathway
          Cookie: `idToken=${token}`,
        },
      });
      if (r.ok) {
        const j = (await r.json()) as { business?: unknown };
        if (j && (j as { business: unknown | null }).business) {
          const url = req.nextUrl.clone();
          url.pathname = '/dashboard';
          url.search = '';
          return NextResponse.redirect(url);
        }
      }
    } catch {}
  }

  // Gate premium integrations (e.g., Square) for non‑Pro plans. If plan cannot be
  // determined due to a transient error, fail open to avoid blocking usage.
  if (pathname.startsWith('/integrations/square')) {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Cookie'] = `idToken=${token}`;
      let res = await fetch(`${req.nextUrl.origin}/api/plan/status`, { headers });
      if (!res.ok && token) {
        res = await fetch(`${req.nextUrl.origin}/api/plan/status`, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (res.ok) {
        const data = (await res.json()) as { status?: string };
        const status = (data?.status || '').toLowerCase();
        if (!['active', 'trialing'].includes(status)) {
          const url = req.nextUrl.clone();
          url.pathname = '/pricing';
          url.search = '';
          url.searchParams.set('from', 'square');
          return NextResponse.redirect(url);
        }
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard', '/onboarding/:path*', '/integrations/:path*'],
};
