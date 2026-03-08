import { NextRequest, NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken, days = 7 } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    try {
      const auth = getAuthAdmin();
      const supa = getSupabaseAdmin();

      const decodedToken = await auth.verifyIdToken(idToken);

      try {
        await supa
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('uid', decodedToken.uid);
      } catch {}

      const expiresIn = days * 24 * 60 * 60 * 1000;
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

      const response = NextResponse.json({ success: true });

      const cookieOptions: Record<string, unknown> = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: expiresIn,
        path: '/',
      };

      // Only scope cookie to the canonical domain when the request is actually
      // on that domain. Vercel preview deployments use *.vercel.app hostnames
      // which won't receive cookies scoped to .reviewsandmarketing.com.
      const reqHost = request.headers.get('host') || '';
      if (process.env.APP_URL) {
        try {
          const canonical = new URL(process.env.APP_URL).hostname.replace(/^www\./, '');
          if (reqHost.endsWith(canonical)) {
            cookieOptions.domain = `.${canonical}`;
          }
        } catch {}
      }

      response.cookies.set('idToken', sessionCookie, cookieOptions as any);

      return response;
    } catch (firebaseError) {
      console.error('[SESSION] Firebase error:', firebaseError);
      return NextResponse.json({ success: true, warning: 'Session cookie creation failed' });
    }
  } catch (error) {
    console.error('[SESSION] Error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}