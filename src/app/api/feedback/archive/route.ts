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
    .single();

  if (!feedback) return new NextResponse('Feedback not found', { status: 404 });

  const { data: business } = await supa
    .from('businesses')
    .select('id')
    .eq('id', feedback.business_id)
    .eq('owner_uid', uid)
    .single();

  if (!business) return new NextResponse('Forbidden', { status: 403 });

  const { error } = await supa
    .from('feedback')
    .update({ archived: !!archived })
    .eq('id', id);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}

