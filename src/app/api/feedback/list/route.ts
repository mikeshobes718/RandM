import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });
  const supa = getSupabaseAdmin();
  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || '60')));
  const limit = Math.min(1000, Math.max(10, Number(url.searchParams.get('limit') || '500')));
  // User's businesses
  const { data: biz } = await supa.from('businesses').select('id').eq('owner_uid', uid);
  const ids = (biz || []).map((b: { id: string }) => b.id);
  if (ids.length === 0) return NextResponse.json({ items: [] });
  // Feedback may or may not exist yet; handle gracefully
  let items: {
    id: string;
    business_id: string;
    rating: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    comment: string | null;
    marketing_consent: boolean | null;
    created_at: string;
  }[] = [];
  try {
    const since = new Date();
    since.setUTCHours(0,0,0,0); since.setUTCDate(since.getUTCDate() - days + 1);
    const { data } = await supa
      .from('feedback')
      .select('id,business_id,rating,name,email,phone,comment,marketing_consent,created_at')
      .in('business_id', ids)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    items = (data as typeof items) || [];
  } catch {}
  return NextResponse.json({ items });
}
