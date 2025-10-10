import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  
  // Use the exact same cookie options as the session route
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/'
  };
  
  // Add domain for production to match session cookie setting
  if (process.env.NODE_ENV === 'production' && process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL);
      const hostname = url.hostname;
      if (hostname.includes('.')) {
        const domain = `.${hostname.replace(/^www\./, '')}`;
        (cookieOptions as any).domain = domain;
      }
    } catch (e) {
      console.warn('Failed to set cookie domain:', e);
    }
  }
  
  // Clear cookies with exact same options as when they were set
  res.cookies.set('idToken', '', cookieOptions);
  res.cookies.set('onboarding_complete', '', { ...cookieOptions, httpOnly: false });
  
  return res;
}
