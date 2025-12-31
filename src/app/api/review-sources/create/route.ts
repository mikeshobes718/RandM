import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureFeedbackTables } from '@/lib/feedbackStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function POST(req: NextRequest) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { businessId, name } = body;

  if (!businessId || !name) return new NextResponse('Missing businessId or name', { status: 400 });

  const supa = getSupabaseAdmin();
  
  // Verify ownership and plan
  const { data: biz } = await supa
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_uid', uid)
    .maybeSingle();
  
  if (!biz) return new NextResponse('Forbidden', { status: 403 });

  // Check Pro status
  const { data: sub } = await supa
    .from('subscriptions')
    .select('status, plan_id')
    .eq('uid', uid)
    .maybeSingle();
  
  const isPro = sub?.status === 'active';
  if (!isPro) return new NextResponse('Pro plan required for multiple sources', { status: 403 });

  try { await ensureFeedbackTables(); } catch (e) {}

  const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 6)}`;

  const { data: source, error } = await supa
    .from('review_sources')
    .insert({
      business_id: businessId,
      name,
      slug,
    })
    .select()
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ source });
}


