import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { ensureFeedbackTables } from '@/lib/feedbackStorage';
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

  // Ensure tables exist BEFORE querying
  try { 
    await ensureFeedbackTables(); 
  } catch (e) {
    console.error('Failed to ensure feedback tables:', e);
    // Continue anyway - table might already exist
  }

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
      // Table might not be in schema cache, try ensuring again and retry
      await ensureFeedbackTables();
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

  const { data: source, error } = await supa
    .from('review_sources')
    .insert({
      business_id: businessId,
      name,
      slug,
    })
    .select()
    .single();

  if (error) {
    console.error('[REVIEW SOURCES] Supabase Error:', error);
    if (error.message.includes('schema cache')) {
      console.log('[REVIEW SOURCES] Schema cache error, falling back to direct SQL...');
      const sql = getSql();
      if (sql) {
        try {
          const result = await sql`
            INSERT INTO review_sources (business_id, name, slug)
            VALUES (${businessId}, ${name}, ${slug})
            RETURNING *
          `;
          if (result && result.length > 0) {
            // Success with fallback!
            return NextResponse.json({ source: result[0] });
          }
        } catch (sqlErr: any) {
          console.error('[REVIEW SOURCES] SQL Fallback failed:', sqlErr);
          return NextResponse.json({ error: sqlErr.message }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source });
}




