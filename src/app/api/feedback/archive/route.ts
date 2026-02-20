import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const { id, archived } = await req.json();
  if (!id) return new NextResponse('Missing ID', { status: 400 });

  const supa = getSupabaseAdmin();

  // Verify ownership of the business associated with this feedback
  const { data: feedback } = await supa
    .from('feedback')
    .select('business_id')
    .eq('id', id)
    .maybeSingle();

  let businessId = feedback?.business_id;

  if (!businessId) {
    // Try review_events
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

  // Update feedback table
  await supa
    .from('feedback')
    .update({ archived: !!archived })
    .eq('id', id);

  // Update review_events table (if it exists there)
  await supa
    .from('review_events')
    .update({ archived: !!archived })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}





