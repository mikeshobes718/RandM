import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getPgPool } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Prefer session cookie; fallback to Authorization bearer
  let uid: string | null = null;
  try {
    uid = await requireUid();
  } catch {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;
    if (!token) return new NextResponse('Unauthorized', { status: 401 });
    try {
      const auth = getAuthAdmin();
      const decoded = await auth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      try {
        uid = (await verifyIdTokenViaRest(token)).uid;
      } catch {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('owner_uid', uid!)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (!error) {
      const row = Array.isArray(data) ? (data[0] || null) : (data as unknown as null);
      return NextResponse.json({ business: row });
    }
  } catch {}
  // Fallback to direct Postgres if REST fetch fails (e.g., egress blocked)
  try {
    const pool = getPgPool();
    if (!pool) throw new Error('pg not configured');
    const q = `select * from businesses where owner_uid = $1 order by updated_at desc limit 1`;
    const r = await pool.query(q, [uid!]);
    const row = r.rows?.[0] || null;
    return NextResponse.json({ business: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`pg fallback failed: ${msg}`, { status: 500 });
  }
}
