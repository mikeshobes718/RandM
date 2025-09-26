import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  // Clear host-only cookie (covers older session cookies)
  res.headers.append('Set-Cookie', 'idToken=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
  res.headers.append('Set-Cookie', 'onboarding_complete=; Max-Age=0; Path=/; SameSite=Lax');
  // Clear domain cookie when present (matches how we set the session cookie)
  try {
    const host = (() => { try { return new URL(process.env.APP_URL || '').hostname; } catch { try { return new URL(req.url).hostname; } catch { return ''; } } })();
    if (host && host.includes('.')) {
      const domain = `.${host.replace(/^www\./,'')}`;
      res.headers.append('Set-Cookie', `idToken=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=${domain}`);
      res.headers.append('Set-Cookie', `onboarding_complete=; Max-Age=0; Path=/; SameSite=Lax; Domain=${domain}`);
    }
  } catch {}
  return res;
}
