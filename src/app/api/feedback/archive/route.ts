import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const uid = await requireUid().catch(() => null);
    if (!uid) return new NextResponse('Unauthorized', { status: 401 });

    let body: { id?: string; archived?: boolean };
    try {
      body = await req.json();
    } catch {
      return new NextResponse('Invalid JSON body', { status: 400 });
    }

    const { id, archived } = body;
    if (!id) return new NextResponse('Missing ID', { status: 400 });

    const supa = getSupabaseAdmin();

    const { data: feedback } = await supa
      .from('feedback')
      .select('business_id')
      .eq('id', id)
      .maybeSingle();

    let businessId = feedback?.business_id;

    if (!businessId) {
      const { data: event } = await supa
        .from('review_events')
        .select('business_id')
        .eq('id', id)
        .maybeSingle();
      businessId = event?.business_id;
    }

    if (!businessId) return new NextResponse('Item not found', { status: 404 });

    const { data: business } = await supa
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_uid', uid)
      .maybeSingle();

    if (!business) return new NextResponse('Forbidden', { status: 403 });

    const archivedValue = !!archived;

    await supa.from('feedback').update({ archived: archivedValue }).eq('id', id);
    await supa.from('review_events').update({ archived: archivedValue }).eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[feedback/archive] Error:', message);
    return new NextResponse(message, { status: 500 });
  }
}
