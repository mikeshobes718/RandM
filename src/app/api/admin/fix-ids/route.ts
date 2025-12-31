import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  
  // Find all businesses with Feature IDs (Ei...)
  const { data: businesses, error } = await supa
    .from('businesses')
    .select('id, name, google_place_id')
    .like('google_place_id', 'Ei%');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ message: 'No businesses found with Feature IDs.' });
  }

  const results = [];

  for (const biz of businesses) {
    try {
      // Use our updated helper which now handles Feature ID fallbacks
      const details = await getPlaceDetails(biz.google_place_id!);
      
      if (details?.id && details.id.startsWith('ChIJ')) {
        // We found the correct ID! Update the database.
        const updateRes = await supa
          .from('businesses')
          .update({ 
            google_place_id: details.id,
            google_maps_write_review_uri: `https://search.google.com/local/writereview?placeid=${details.id}`
          })
          .eq('id', biz.id);

        results.push({
          name: biz.name,
          old_id: biz.google_place_id,
          new_id: details.id,
          success: !updateRes.error
        });
      } else {
        results.push({
          name: biz.name,
          old_id: biz.google_place_id,
          status: 'Could not find standard Place ID'
        });
      }
    } catch (e: any) {
      results.push({
        name: biz.name,
        error: e.message
      });
    }
  }

  return NextResponse.json({ results });
}

