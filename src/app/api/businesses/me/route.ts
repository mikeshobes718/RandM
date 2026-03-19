import { NextRequest, NextResponse } from 'next/server';
import { resolveUid } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) return NextResponse.json({ business: null });

    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('businesses')
      .select('id,name,slug,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address,business_type,updated_at')
      .eq('owner_uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[businesses/me] supabase error:', error.message);
      return NextResponse.json({ business: null, _debug: error.message }, { status: 200 });
    }

    const row = Array.isArray(data) ? (data[0] || null) : null;
    return NextResponse.json({ business: row });
  } catch (err) {
    console.error('[businesses/me] crash:', err);
    return NextResponse.json({ business: null, _debug: String(err) }, { status: 200 });
  }
}
