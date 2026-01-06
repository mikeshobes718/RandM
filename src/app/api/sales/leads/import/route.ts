import { NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/googlePlaces';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { city, state, country, type } = await req.json();
    if (!city || !type) {
      return new NextResponse('Missing city or type', { status: 400 });
    }

    const location = [city, state, country].filter(Boolean).join(', ');
    const query = `${type} in ${location}`;
    const places = await searchBusinesses(query);
    const supa = getSupabaseAdmin();

    const leadsToInsert = places.map((p: any) => ({
      google_place_id: p.id,
      name: p.displayName?.text || 'Unknown',
      address: p.formattedAddress,
      rating: p.rating,
      review_count: p.userRatingCount || 0,
      business_type: type,
      city: city.toLowerCase(),
      state: state || null,
      country: country || null,
    }));

    if (leadsToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No businesses found' });
    }

    // Upsert into leads table
    const { error } = await supa
      .from('leads')
      .upsert(leadsToInsert, { onConflict: 'google_place_id' });

    if (error) {
      console.error('[IMPORT LEADS] DB Error:', error);
      return new NextResponse('Database error', { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: leadsToInsert.length, 
      message: `Successfully imported ${leadsToInsert.length} leads for ${type} in ${city}` 
    });
  } catch (error) {
    console.error('[IMPORT LEADS] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

