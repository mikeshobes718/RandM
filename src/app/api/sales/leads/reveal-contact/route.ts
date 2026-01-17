import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPlaceDetails } from '@/lib/googlePlaces';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const { googlePlaceId, leadData } = await req.json();

    console.log('[REVEAL CONTACT] Received request for:', googlePlaceId);

    if (!googlePlaceId) {
      return NextResponse.json({ error: 'Missing googlePlaceId' }, { status: 400 });
    }

    // 1. First check if we already have this lead in the DB with phone
    const { data: existingLead } = await supa
      .from('leads')
      .select('phone, website')
      .eq('google_place_id', googlePlaceId)
      .maybeSingle();

    if (existingLead?.phone) {
      console.log('[REVEAL CONTACT] Phone already in DB:', existingLead.phone);
      return NextResponse.json({ 
        success: true, 
        phone: existingLead.phone, 
        website: existingLead.website,
        source: 'database'
      });
    }

    // 2. Fetch details from Google Places API
    console.log('[REVEAL CONTACT] Fetching from Google Places API...');
    let details;
    try {
      details = await getPlaceDetails(googlePlaceId);
      console.log('[REVEAL CONTACT] Google response:', {
        hasPhone: !!details.nationalPhoneNumber || !!details.internationalPhoneNumber,
        hasWebsite: !!details.websiteUri
      });
    } catch (googleErr: any) {
      console.error('[REVEAL CONTACT] Google API error:', googleErr.message);
      return NextResponse.json({ 
        error: `Google Places API error: ${googleErr.message}`,
        suggestion: 'The place ID may be invalid or the API quota may be exceeded.'
      }, { status: 500 });
    }
    
    const phone = details.nationalPhoneNumber || details.internationalPhoneNumber || null;
    const website = details.websiteUri || null;

    if (!phone) {
      console.log('[REVEAL CONTACT] No phone found for this business');
      // Still return success but with no phone - some businesses don't list their phone
      return NextResponse.json({ 
        success: true, 
        phone: null, 
        website,
        message: 'This business has no phone number listed on Google.'
      });
    }

    // 3. Save or Update in DB
    const fullAddress = leadData?.address || details.formattedAddress;
    let dbCity = leadData?.city || '';
    let dbState = leadData?.state || '';
    
    if (fullAddress && (!dbCity || !dbState)) {
      const parts = fullAddress.split(',').map((p: string) => p.trim());
      if (parts.length >= 3) {
        if (!dbCity) dbCity = parts[parts.length - 3];
        const stateZip = parts[parts.length - 2];
        const stateMatch = stateZip?.match(/^([A-Z]{2})/);
        if (stateMatch && !dbState) dbState = stateMatch[1];
      }
    }

    const { data: lead, error: dbError } = await supa
      .from('leads')
      .upsert({
        google_place_id: googlePlaceId,
        name: leadData?.name || details.displayName?.text,
        address: fullAddress,
        rating: leadData?.rating || details.rating,
        review_count: leadData?.reviewCount || details.userRatingCount,
        business_type: leadData?.type,
        google_maps_url: leadData?.googleMapsUrl || details.googleMapsUri,
        city: dbCity.toLowerCase() || null,
        state: dbState || null,
        phone: phone,
        website: website,
      }, { onConflict: 'google_place_id' })
      .select()
      .single();

    if (dbError) {
      console.error('[REVEAL CONTACT] DB Error:', dbError);
      // Still return the phone even if DB save fails
    }

    console.log('[REVEAL CONTACT] Success! Phone:', phone);
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
