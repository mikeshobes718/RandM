import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const { googlePlaceId, leadData } = await req.json();

    if (!googlePlaceId) {
      return NextResponse.json({ error: 'Missing googlePlaceId' }, { status: 400 });
    }

    // 1. Fetch expensive details from Google (Atmosphere + Contact)
    // We already have rating, but Google charges for the detail call anyway.
    const details = await getPlaceDetails(googlePlaceId);
    
    const phone = details.nationalPhoneNumber || details.internationalPhoneNumber || null;
    const website = details.websiteUri || null;

    // 2. Save or Update in DB
    const { data: lead, error: dbError } = await supa
      .from('leads')
      .upsert({
        google_place_id: googlePlaceId,
        name: leadData.name,
        address: leadData.address,
        rating: leadData.rating,
        review_count: leadData.reviewCount,
        business_type: leadData.type,
        google_maps_url: leadData.googleMapsUrl,
        city: leadData.address?.split(',')?.slice(-3, -2)?.[0]?.trim()?.toLowerCase() || null,
        phone: phone,
        website: website,
      }, { onConflict: 'google_place_id' })
      .select()
      .single();

    if (dbError) {
      console.error('[REVEAL CONTACT] DB Error:', dbError);
    }

    return NextResponse.json({ 
      success: true, 
      phone, 
      website,
      dbId: lead?.id 
    });
  } catch (error: any) {
    console.error('[REVEAL CONTACT] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
