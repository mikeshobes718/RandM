import { NextResponse } from 'next/server';
import { searchBusinesses, getPlaceDetails } from '@/lib/googlePlaces';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { city, state, country, type } = await req.json();
    if (!city || !type) {
      return new NextResponse('Missing city or type', { status: 400 });
    }

    const location = [city, state, country].filter(Boolean).join(', ');
    const supa = getSupabaseAdmin();

    let allPlaces: any[] = [];
    
    // We'll try multiple search variations to get up to 50+ leads
    const searchVariations = [
      `${type} in ${location}`,
      `best ${type} in ${location}`,
      `top ${type} in ${location}`,
      `worst rated ${type} in ${location}`,
      `${type} establishments in ${location}`,
    ];

    for (const searchQuery of searchVariations) {
      if (allPlaces.length >= 80) break; // Fetch a healthy buffer
      const places = await searchBusinesses(searchQuery);
      places.forEach((p: any) => {
        if (!allPlaces.find(ap => ap.id === p.id)) {
          allPlaces.push(p);
        }
      });
    }

    // Filter for low-rated leads before fetching details to save API quota
    // We only need details for leads we might actually use
    const filteredLeads = allPlaces.filter(p => p.rating != null && p.rating <= 4.2);

    // Fetch details for each lead to ensure we have phone numbers
    // Google's searchText often omits phone numbers in the list response
    const leadsWithDetails = await Promise.all(
      filteredLeads.slice(0, 60).map(async (p) => {
        if (p.nationalPhoneNumber || p.internationalPhoneNumber) {
          return {
            ...p,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber
          };
        }
        try {
          const details = await getPlaceDetails(p.id);
          return {
            ...p,
            phone: details.nationalPhoneNumber || details.internationalPhoneNumber || null
          };
        } catch (e) {
          return { ...p, phone: null };
        }
      })
    );

    const leadsToInsert = leadsWithDetails.map((p: any) => ({
      google_place_id: p.id,
      name: p.displayName?.text || 'Unknown',
      address: p.formattedAddress,
      rating: p.rating,
      review_count: p.userRatingCount || 0,
      business_type: type,
      city: city.toLowerCase(),
      state: state || null,
      country: country || null,
      phone: p.phone,
      google_maps_url: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
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
      
      // Return full error for debugging
      return NextResponse.json({ 
        success: false, 
        error: error.message, 
        details: error,
        hint: 'If this is a column missing error, the fallback should have handled it.'
      }, { status: 500 });
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

