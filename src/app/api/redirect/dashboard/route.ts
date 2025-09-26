import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const c = await cookies();
    const token = c.get('idToken')?.value || '';
    const url = new URL(req.url);
    const nextParam = url.searchParams.get('next') || '';
    const isOnboarding = (p: string) => p === '/onboarding' || p.startsWith('/onboarding/');
    if (token) {
      const auth = getAuthAdmin();
      let uid: string | null = null;
      try { uid = (await auth.verifySessionCookie(token, true)).uid as string; } catch { try { uid = (await auth.verifyIdToken(token)).uid as string; } catch {} }
      if (uid) {
        try {
          const supa = getSupabaseAdmin();
          const { data } = await supa.from('businesses').select('id').eq('owner_uid', uid).limit(1);
          if (Array.isArray(data) && data[0]?.id) {
            const dest = nextParam && !isOnboarding(nextParam) ? nextParam : '/dashboard';
            return NextResponse.redirect(new URL(dest, process.env.APP_URL || 'https://reviewsandmarketing.com'));
          }
        } catch {}
      }
    }
  } catch {}
  return NextResponse.redirect(new URL('/onboarding/business', process.env.APP_URL || 'https://reviewsandmarketing.com'));
}

export const dynamic = 'force-dynamic';











