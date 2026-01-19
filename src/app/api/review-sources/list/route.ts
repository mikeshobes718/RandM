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

  const { data: sources, error } = await supa
    .from('review_sources')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message?.includes('schema cache')) {
      console.log('[REVIEW SOURCES LIST] Schema cache error, falling back to direct SQL...');
      const sql = getSql();
      if (sql) {
        try {
          const results = await sql`
            SELECT * FROM review_sources 
            WHERE business_id = ${businessId}
            ORDER BY created_at DESC
          `;
          return NextResponse.json({ sources: results || [] });
        } catch (sqlErr: any) {
          console.error('[REVIEW SOURCES LIST] SQL Fallback failed:', sqlErr);
        }
      }
    }
    // If table doesn't exist, return empty array instead of error
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      return NextResponse.json({ sources: [] });
    }
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ sources: sources || [] });
}





