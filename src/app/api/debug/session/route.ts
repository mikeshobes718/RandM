import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUid } from '@/lib/authServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = url.hostname;
  const ck = await cookies();
  const cookieVal = ck.get('idToken')?.value || '';
  const hasCookie = Boolean(cookieVal);
  const authHeader = (req.headers.get('authorization') || '').trim();
  const hasBearer = authHeader.toLowerCase().startsWith('bearer ');

  const auth = getAuthAdmin();
  let uid: string | null = null;
  let validSession = false;
  try {
    // Prefer server helper
    uid = await requireUid();
    validSession = true;
  } catch {}
  if (!uid) {
    // Try session cookie verify
    if (hasCookie) {
      try { const dec = await auth.verifySessionCookie(cookieVal, true); uid = dec.uid; validSession = true; } catch {}
    }
  }
  if (!uid && hasCookie) {
    // Fallback: raw ID token in cookie
    try { const dec = await auth.verifyIdToken(cookieVal); uid = dec.uid; } catch {}
  }
  if (!uid && hasBearer) {
    const tok = authHeader.slice(7);
    try { const dec = await auth.verifyIdToken(tok); uid = dec.uid; } catch {}
  }

  let businessCount = -1;
  if (uid) {
    try {
      const supa = getSupabaseAdmin();
      const { count } = await supa
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('owner_uid', uid);
      businessCount = count ?? 0;
    } catch { businessCount = -2; }
  }

  return NextResponse.json({ host, hasCookie, hasBearer, validSession, uid, businessCount });
}

