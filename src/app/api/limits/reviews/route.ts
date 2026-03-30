import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlanLimits } from '@/lib/entitlements';
import { fetchUsageCounts } from '@/lib/dashboard/stats';

export async function GET() {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const supa = getSupabaseAdmin();
  const limits = await getPlanLimits(uid);
  const limit = limits.id === 'pro' ? null : limits.reviewLimit;
  const pro = limits.id === 'pro';
  let used = 0;
  if (limit !== null) {
    const { data: biz } = await supa.from('businesses').select('id').eq('owner_uid', uid).order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (biz?.id) {
      const u = await fetchUsageCounts(biz.id);
      used = u.requestsUsed;
    }
  }
  return NextResponse.json({ pro, used, limit });
}

