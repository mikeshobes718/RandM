import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function startOfCurrentMonthUTC(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return utc.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const uid = await requireUid();
    const supa = getSupabaseAdmin();

    // 1. Get Business
    const { data: biz } = await supa.from('businesses').select('id').eq('owner_uid', uid).maybeSingle();
    if (!biz) return NextResponse.json({ used: 0, limit: 3, qrScans: 0, isUnlimited: false });

    // 2. Get Subscription
    const { data: sub } = await supa.from('subscriptions').select('status, plan_id').eq('uid', uid).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    
    let planStatus = 'none';
    if (sub) planStatus = sub.status.toLowerCase();
    else if (biz) planStatus = 'starter';

    let requestsLimit = 3;
    if (planStatus === 'active' || planStatus === 'trialing') {
      const planId = (sub?.plan_id || '').toLowerCase();
      if (planId.includes('mid') || planId.includes('growth')) requestsLimit = 100;
      else requestsLimit = 999999;
    }

    // 3. Count Requests This Month
    const startOfMonth = startOfCurrentMonthUTC();
    const { count: requestsUsed } = await supa
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .gte('created_at', startOfMonth);

    // 4. Count QR Scans This Month
    const { count: qrScans } = await supa
      .from('review_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('event', 'page_opened')
      .gte('created_at', startOfMonth);

    return NextResponse.json({
      used: requestsUsed || 0,
      limit: requestsLimit,
      qrScans: qrScans || 0,
      isUnlimited: requestsLimit > 1000,
      planStatus
    });
  } catch (err) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
