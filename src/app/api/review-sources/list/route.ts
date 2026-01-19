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
  let customSources: any[] = [];
  let mainQrScans = 0;

  try {
    const sql = getSql();
    if (sql) {
      // 1. Fetch custom sources
      console.log('[REVIEW SOURCES LIST] Querying custom sources for business:', businessId);
      customSources = await sql`
        SELECT 
          s.*,
          (SELECT count(*)::int FROM review_events e WHERE e.business_id = s.business_id AND e.metadata->>'source' = s.slug) as scans
        FROM review_sources s
        WHERE s.business_id = ${businessId}
        ORDER BY s.created_at DESC
      `;
      console.log('[REVIEW SOURCES LIST] Found', customSources.length, 'custom sources');
      
      // 2. Calculate scans for the "Main QR" (defaults like 'landing' or 'main-qr')
      const mainScansResult = await sql`
        SELECT count(*)::int as count
        FROM review_events 
        WHERE business_id = ${businessId} 
        AND (metadata->>'source' = 'landing' OR metadata->>'source' = 'main-qr' OR metadata->>'source' IS NULL)
      `;
      mainQrScans = mainScansResult[0]?.count || 0;
    } else {
      console.log('[REVIEW SOURCES LIST] Using Supabase client fallback');
      // Basic fallback using Supabase client
      const { data, error: supaError } = await supa
        .from('review_sources')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (!supaError && data) {
        customSources = data;
        console.log('[REVIEW SOURCES LIST] Supabase returned', data.length, 'sources');
      } else if (supaError) {
        console.error('[REVIEW SOURCES LIST] Supabase error:', supaError);
      }

      // Fetch main scans count via Supabase
      const { count: mainScansCount } = await supa
        .from('review_events')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .or('metadata->>source.eq.landing,metadata->>source.eq.main-qr,metadata->>source.is.null');
      
      mainQrScans = mainScansCount || 0;
    }
  } catch (err: any) {
    console.error('[REVIEW SOURCES LIST] Error fetching sources:', err);
    console.error('[REVIEW SOURCES LIST] Error stack:', err.stack);
    // If table doesn't exist, we still want to show the Main QR
  }

  // Always include the virtual "Main QR" at the top
  const mainSource = {
    id: 'main-qr-id',
    business_id: businessId,
    name: 'Main QR (Toolkit)',
    slug: 'main-qr',
    scans: mainQrScans,
    created_at: new Date(0).toISOString() // Always first
  };

  const results = [mainSource, ...customSources];

  console.log(`[REVIEW SOURCES LIST] Returning ${results.length} sources for business ${businessId}:`, results.map(s => ({ id: s.id, name: s.name, slug: s.slug })));

  return NextResponse.json({ sources: results });
}





