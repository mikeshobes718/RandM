import { NextRequest, NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';

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

  // Fetch sources with scan counts
  let customSources: any[] = [];
  let mainQrScans = 0;

  const sql = getSql();
  const useSql = !!sql;
  
  if (useSql) {
    try {
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
    } catch (sqlErr) {
      console.error('[review-sources/list] SQL query failed, falling back:', sqlErr);
      customSources = []; // Ensure empty before fallback
    }
  }

  // Fallback to Supabase client if SQL failed or was unavailable
  if (customSources.length === 0) {
    try {
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
      console.error('[review-sources/list] Supabase fallback failed:', err);
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

  return NextResponse.json({ sources: results });
}