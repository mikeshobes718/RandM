import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlanLimits } from '@/lib/entitlements';

export async function GET() {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const supa = getSupabaseAdmin();
  const limits = await getPlanLimits(uid);
  const limit = limits.id === 'pro' ? null : limits.reviewLimit;
  const pro = limits.id === 'pro';
  let used = 0;
  if (limit !== null) {
    const since = new Date();
    since.setUTCDate(1); since.setUTCHours(0,0,0,0);
    const { data: biz } = await supa.from('businesses').select('id').eq('owner_uid', uid);
    const ids = (biz||[]).map(b=>b.id);
    if (ids.length) {
      const { count } = await supa
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .in('business_id', ids)
        .gte('created_at', since.toISOString());
      used = count || 0;
    }
  }
  return NextResponse.json({ pro, used, limit });
}

