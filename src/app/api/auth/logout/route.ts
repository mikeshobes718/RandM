import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  
  // Delete cookies using Next.js cookies.delete() method
  res.cookies.delete('idToken');
  res.cookies.delete('onboarding_complete');
  
  // Also set them with expires in the past as a fallback
  const pastDate = new Date(0);
  const deleteOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: pastDate,
    maxAge: 0,
    path: '/'
  };
  
  // Set cookies to expired state
  res.cookies.set('idToken', '', deleteOptions);
  res.cookies.set('onboarding_complete', '', { ...deleteOptions, httpOnly: false });
  
  // Add domain-specific deletion for production
  if (process.env.NODE_ENV === 'production' && process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL);
      const hostname = url.hostname;
      if (hostname.includes('.')) {
        const domain = `.${hostname.replace(/^www\./, '')}`;
        // Delete with domain
        res.cookies.set('idToken', '', { ...deleteOptions, domain });
        res.cookies.set('onboarding_complete', '', { ...deleteOptions, httpOnly: false, domain });
      }
    } catch (e) {
      console.warn('Failed to clear domain cookies:', e);
    }
  }
  
  console.log('[LOGOUT] Cookies cleared successfully');
  
  // Add cache control headers to prevent caching of the logout response
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  
  return res;
}
