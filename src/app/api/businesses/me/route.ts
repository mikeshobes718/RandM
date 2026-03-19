import { NextRequest, NextResponse } from 'next/server';
import { resolveUid } from '@/lib/apiHelpers';
import { getSql } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) return NextResponse.json({ business: null });

    const sql = getSql();
    if (!sql) return NextResponse.json({ business: null, _debug: 'no db' });

    const rows = await sql`
      SELECT id, name, slug, review_link, google_maps_write_review_uri,
             google_rating, google_place_id, contact_phone, google_photo_url,
             address, business_type, updated_at
      FROM businesses
      WHERE owner_uid = ${uid}
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    return NextResponse.json({ business: rows[0] || null });
  } catch (err) {
    console.error('[businesses/me] crash:', err);
    return NextResponse.json({ business: null, _debug: String(err) });
  }
}
