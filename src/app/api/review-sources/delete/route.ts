import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { businessId, sourceId } = body;

  if (!businessId || !sourceId) return new NextResponse('Missing businessId or sourceId', { status: 400 });

  const supa = getSupabaseAdmin();
  
  // Verify ownership
  const { data: biz } = await supa
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_uid', uid)
    .maybeSingle();
  
  if (!biz) return new NextResponse('Forbidden', { status: 403 });

  const { error } = await supa
    .from('review_sources')
    .delete()
    .eq('id', sourceId)
    .eq('business_id', businessId);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}





