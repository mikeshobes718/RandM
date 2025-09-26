import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { requireUid } from '@/lib/authServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUidFrom(req: Request): Promise<string|null> {
  try { return await requireUid(); } catch {}
  // Fallback to cookie raw token
  const cookie = (req.headers.get('cookie') || '').split(';').map(s=>s.trim()).find(s=>s.toLowerCase().startsWith('idtoken='));
  if (cookie) {
    const val = cookie.split('=')[1] || '';
    if (val) {
      try { const dec = await getAuthAdmin().verifySessionCookie(val, true); return dec.uid; } catch {}
      try { const dec = await getAuthAdmin().verifyIdToken(val); return dec.uid; } catch {}
    }
  }
  // Bearer header
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    try { const dec = await getAuthAdmin().verifyIdToken(auth.slice(7)); return dec.uid; } catch {}
  }
  return null;
}

export async function GET(req: Request) {
  const uid = await getUidFrom(req);
  const supa = getSupabaseAdmin();
  let count = -1 as number;
  let latest: unknown = null;
  let readError: string | null = null;
  try {
    const r = await supa
      .from('businesses')
      .select('*', { count: 'exact' })
      .eq('owner_uid', uid || '')
      .order('updated_at', { ascending: false })
      .limit(1);
    count = r.count ?? 0;
    latest = Array.isArray(r.data) ? (r.data[0] || null) : null;
    if (r.error) readError = r.error.message;
  } catch (e) {
    readError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({ uid, count, latest, readError });
}
