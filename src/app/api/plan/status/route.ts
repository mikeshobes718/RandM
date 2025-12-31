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
  let data = null;
  let error = null;
  const supa = getSupabaseAdmin();
  try {
    const result = await supa
      .from('subscriptions')
      .select('status, plan_id, updated_at')
      .eq('uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    data = result.data;
    error = result.error;
  } catch (err) {
    console.error('[API/PLAN/STATUS] Supabase error:', err);
  }
  
  if (error) {
    console.error('[API/PLAN/STATUS] Subscriptions fetch error:', error);
    // Don't return 500, just continue to fallbacks
  }
  const rawStatus = (data?.status as string | undefined) || 'none';
  const planId = (data?.plan_id as string | undefined) || null;
  
  // If no subscription found, check if user has a business (indicates starter plan)
  if (!data) {
    try {
      const { data: business } = await supa
        .from('businesses')
        .select('id')
        .eq('owner_uid', uid)
        .maybeSingle();
      
      if (business) {
        return NextResponse.json({ status: 'starter', plan: 'starter' });
      }
    } catch (businessError) {
      console.error('Error checking business:', businessError);
    }
  }
  
  const normalizedStatus = planId === 'starter' && rawStatus.toLowerCase() === 'active' ? 'starter' : rawStatus;
  return NextResponse.json({ status: normalizedStatus, plan: planId });
}
