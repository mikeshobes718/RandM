import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { getPlanLimits } from '@/lib/entitlements';

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

  // Enforce plan limits
  const limits = await getPlanLimits(uid);
  
  // Count existing sources (retry if table doesn't exist)
  let count = 0;
  try {
    const { count: sourceCount, error: countError } = await supa
      .from('review_sources')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);
    
    if (countError && countError.message?.includes('schema cache')) {
      const retry = await supa
        .from('review_sources')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);
      count = retry.count || 0;
    } else {
      count = sourceCount || 0;
    }
  } catch (e) {
    // If table truly doesn't exist, allow creation (count = 0)
    console.error('Error counting sources:', e);
    count = 0;
  }

  if (count >= limits.qrLimit) {
    return new NextResponse(`QR code limit of ${limits.qrLimit} reached for the ${limits.name} plan. Upgrade to create more unique QR codes.`, { status: 403 });
  }

  const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 6)}`;

  const sql = getSql();
  let source: any = null;

  if (sql) {
    try {
      const result = await sql`
        INSERT INTO review_sources (business_id, name, slug)
        VALUES (${businessId}, ${name}, ${slug})
        RETURNING *
      `;
      if (result && result.length > 0) {
        source = result[0];
      }
    } catch (sqlErr: any) {
      console.error('[review-sources/create] SQL insert failed:', sqlErr.message);
    }
  }

  if (!source) {
    const { data, error } = await supa
      .from('review_sources')
      .insert({
        business_id: businessId,
        name,
        slug,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[review-sources/create] Supabase insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    source = data;
  }

  if (!source) {
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }

  return NextResponse.json({ source });
}




