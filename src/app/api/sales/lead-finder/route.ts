import { NextResponse } from 'next/server';
import { searchBusinesses, getPlaceDetails } from '@/lib/googlePlaces';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const state = searchParams.get('state');
  const country = searchParams.get('country');
  const type = searchParams.get('type') || 'bar';
  const query = searchParams.get('query');
  const maxRating = parseFloat(searchParams.get('maxRating') || '4.2');

  const supa = getSupabaseAdmin();
  
  // Normalize city name (e.g., "New York City" -> "new york")
  const normalizedCity = city?.toLowerCase().replace(/ city$/, '').trim();

  try {
    const location = [city, state, country].filter(Boolean).join(', ');
    const searchQuery = query || (location && type ? `${type} in ${location}` : null);
    if (!searchQuery) return new NextResponse('Missing query or location', { status: 400 });

    // 1. Live Search from Google
    const places = await searchBusinesses(searchQuery);
    
    // 2. Filter by rating and fetch details (phone/website)
    const filteredPlaces = places
      .filter((p: any) => p.rating != null && p.rating <= maxRating)
      .slice(0, 40); // Limit for performance

    const placesWithDetails = await Promise.all(
      filteredPlaces.map(async (p: any) => {
        try {
          const details = await getPlaceDetails(p.id);
          return {
            ...p,
            phone: details.nationalPhoneNumber || details.internationalPhoneNumber || p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            googleMapsUri: details.googleMapsUri || p.googleMapsUri,
            website: details.websiteUri || null,
          };
        } catch (e) {
          return { ...p, phone: p.nationalPhoneNumber || p.internationalPhoneNumber || null, website: null };
        }
      })
    );

    // 3. Check our DB for these leads to get call history
    const googlePlaceIds = placesWithDetails.map(p => p.id);
    let dbLeadsMap = new Map();
    
    if (googlePlaceIds.length > 0) {
      const { data: dbLeads } = await supa
        .from('leads')
        .select('*')
        .in('google_place_id', googlePlaceIds);
      
      if (dbLeads) {
        dbLeads.forEach(l => dbLeadsMap.set(l.google_place_id, l));
      }
    }

    // 4. Merge Data
    let combinedLeads = placesWithDetails.map((p: any) => {
      const dbLead = dbLeadsMap.get(p.id);
      return {
        id: p.id,
        dbId: dbLead?.id || null,
        name: p.displayName?.text || 'Unknown',
        address: p.formattedAddress,
        rating: p.rating,
        reviewCount: p.userRatingCount || 0,
        type: type || (p.primaryType ? p.primaryType.replace(/_/g, ' ') : p.types?.[0]?.replace(/_/g, ' ')),
        phone: dbLead?.phone || p.phone || 'No Phone',
        googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        website: dbLead?.website || p.website || null,
        timesCalled: dbLead?.times_called || 0,
        lastCalledAt: dbLead?.last_called_at || null,
        callStatus: dbLead?.call_status || 'fresh',
        nextFollowup: dbLead?.next_followup || null,
        notes: dbLead?.lead_notes || null,
      };
    });

    // 5. Also add any leads from our DB for this city/type that WEREN'T in the Google search
    if (normalizedCity && type) {
      let dbQuery = supa
        .from('leads')
        .select('*')
        .eq('business_type', type)
        .eq('city', normalizedCity)
        .lte('rating', maxRating);
      
      if (googlePlaceIds.length > 0) {
        dbQuery = dbQuery.not('google_place_id', 'in', `(${googlePlaceIds.join(',')})`);
      }
      
      const { data: extraDbLeads } = await dbQuery.limit(50);

      if (extraDbLeads && extraDbLeads.length > 0) {
        const extraLeads = extraDbLeads.map(l => ({
          id: l.google_place_id,
          dbId: l.id,
          name: l.name,
          address: l.address,
          rating: l.rating,
          reviewCount: l.review_count,
          type: l.business_type,
          phone: l.phone,
          googleMapsUrl: l.google_maps_url,
          website: l.website,
          timesCalled: l.times_called || 0,
          lastCalledAt: l.last_called_at,
          callStatus: l.call_status || 'fresh',
          nextFollowup: l.next_followup,
          notes: l.lead_notes,
        }));
        combinedLeads = [...combinedLeads, ...extraLeads];
      }
    }

    return NextResponse.json({ leads: combinedLeads.sort((a: any, b: any) => a.rating - b.rating) });
  } catch (error) {
    console.error('[LEAD FINDER API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
