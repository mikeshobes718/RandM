import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { ensureFeedbackTables } from '@/lib/feedbackStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return new NextResponse('Missing businessId', { status: 400 });

  const supa = getSupabaseAdmin();
  
  // Verify ownership
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
  }

  // Fetch sources with scan counts
  let results: any[] = [];
  try {
    const sql = getSql();
    if (sql) {
      // 1. Fetch custom sources
      const sources = await sql`
        SELECT 
          s.*,
          (SELECT count(*)::int FROM review_events e WHERE e.business_id = s.business_id AND e.metadata->>'source' = s.slug) as scans
        FROM review_sources s
        WHERE s.business_id = ${businessId}
        ORDER BY s.created_at DESC
      `;
      
      // 2. Calculate scans for the "Main QR" (defaults like 'landing' or 'main-qr')
      const mainScans = await sql`
        SELECT count(*)::int 
        FROM review_events 
        WHERE business_id = ${businessId} 
        AND (metadata->>'source' = 'landing' OR metadata->>'source' = 'main-qr' OR metadata->>'source' IS NULL)
      `;

      // 3. Add the virtual "Main QR" to the top of the list
      const mainSource = {
        id: 'main-qr-id',
        business_id: businessId,
        name: 'Main QR (Toolkit)',
        slug: 'main-qr',
        scans: mainScans[0].count,
        created_at: new Date(0).toISOString() // Always first
      };

      results = [mainSource, ...sources];
    } else {
      // Basic fallback
      const { data, error: supaError } = await supa
        .from('review_sources')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (supaError) throw supaError;
      results = data || [];
    }
  } catch (err: any) {
    console.error('[REVIEW SOURCES LIST] Error:', err);
    if (err.message?.includes('does not exist')) return NextResponse.json({ sources: [] });
    return new NextResponse(err.message, { status: 500 });
  }

  return NextResponse.json({ sources: results || [] });
}





