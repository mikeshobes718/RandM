import { NextRequest, NextResponse } from 'next/server';
import { resolveUid } from '@/lib/apiHelpers';
import { getSupabaseAdmin, peekSupabaseServiceKeyRole } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) return NextResponse.json({ business: null });

    if (peekSupabaseServiceKeyRole() !== 'service_role') {
      return NextResponse.json({
        business: null,
        hint:
          'SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT from Supabase → Settings → API (not the anon key).',
      });
    }

    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('businesses')
      .select(
        'id,name,slug,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address,business_type,updated_at'
      )
      .eq('owner_uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[businesses/me] Supabase:', error.message);
      return NextResponse.json({ business: null, hint: error.message });
    }

    const row = Array.isArray(data) ? (data[0] || null) : null;
    return NextResponse.json({ business: row });
  } catch (err) {
    console.error('[businesses/me]', err);
    return NextResponse.json({ business: null });
  }
}
