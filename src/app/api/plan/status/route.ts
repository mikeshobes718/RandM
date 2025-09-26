import { NextResponse } from 'next/server';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let uid = await requireUid().catch(() => null);
  if (!uid) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (token) {
      uid = await verifyIdTokenViaRest(token).then((r) => r.uid).catch(() => null);
    }
  }
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('subscriptions')
    .select('status, plan_id, updated_at')
    .eq('uid', uid)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return new NextResponse(error.message, { status: 500 });
  const rawStatus = (data?.status as string | undefined) || 'none';
  const planId = (data?.plan_id as string | undefined) || null;
  const normalizedStatus = planId === 'starter' && rawStatus.toLowerCase() === 'active' ? 'starter' : rawStatus;
  return NextResponse.json({ status: normalizedStatus, plan: planId });
}
