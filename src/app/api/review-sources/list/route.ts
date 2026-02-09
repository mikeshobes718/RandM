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

  const sql = getSql();
  const useSql = !!sql;
  
  if (useSql) {
    try {
      console.log('[REVIEW SOURCES LIST] Querying custom sources for business:', businessId);
      customSources = await sql`
        SELECT 
          s.*,
          (
            SELECT count(*)::int 
            FROM review_events e 
            WHERE e.business_id = s.business_id 
            AND (
              e.metadata->>'source' = s.slug 
              OR e.metadata->>'source' = 'main-qr-source-' || s.slug
            )
          ) as scans
        FROM review_sources s
        WHERE s.business_id = ${businessId}
        ORDER BY s.created_at DESC
      `;
      
      const mainScansResult = await sql`
        SELECT count(*)::int as count
        FROM review_events 
        WHERE business_id = ${businessId} 
        AND (
          metadata->>'source' = 'landing' 
          OR metadata->>'source' = 'main-qr' 
          OR metadata->>'source' = 'main-qr-source-main-qr'
          OR metadata->>'source' IS NULL
        )
      `;
      mainQrScans = mainScansResult[0]?.count || 0;
      console.log('[REVIEW SOURCES LIST] SQL Success:', customSources.length, 'sources');
    } catch (sqlErr) {
      console.error('[REVIEW SOURCES LIST] SQL Client failed, falling back to Supabase client:', sqlErr);
      customSources = []; // Ensure empty before fallback
    }
  }

  // Fallback to Supabase client if SQL failed or was unavailable
  if (customSources.length === 0) {
    try {
      console.log('[REVIEW SOURCES LIST] Using Supabase client fallback');
      const { data, error: supaError } = await supa
        .from('review_sources')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (!supaError && data) {
        // For each source, fetch its scan count
        const sourcesWithScans = await Promise.all(data.map(async (s) => {
          const { count } = await supa
            .from('review_events')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .or(`metadata->>source.eq.${s.slug},metadata->>source.eq.main-qr-source-${s.slug}`);
          return { ...s, scans: count || 0 };
        }));
        customSources = sourcesWithScans;
      }

      const { count: mainScansCount } = await supa
        .from('review_events')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .or('metadata->>source.eq.landing,metadata->>source.eq.main-qr,metadata->>source.eq.main-qr-source-main-qr,metadata->>source.is.null');
      
      mainQrScans = mainScansCount || 0;
    } catch (err) {
      console.error('[REVIEW SOURCES LIST] Supabase fallback also failed:', err);
    }
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