import { NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/googlePlaces';
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
  const forceGoogle = searchParams.get('forceGoogle') === 'true';

  const supa = getSupabaseAdmin();
  const normalizedCity = city?.toLowerCase().replace(/ city$/, '').trim();
  const isAllCities = normalizedCity === 'all cities' || city === 'All Cities';

  try {
    const location = [city, state, country].filter(Boolean).join(', ');
    const searchQuery = query || (location && type ? `${type} in ${location}` : null);
    if (!searchQuery) return new NextResponse('Missing query or location', { status: 400 });

    let combinedLeads: any[] = [];
    let googlePlaceIdsFound: string[] = [];

    // 1. STEP 1: Search Database First (FREE) - Paginate to get ALL leads
    if (type && state) {
      let allDbLeads: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let dbQuery = supa
          .from('leads')
          .select('*')
          .eq('state', state)
          .lte('rating', maxRating);

        // Optional category filter - if "all" or specific
        if (type !== 'all' && type !== 'restaurant') { 
           // If they chose something specific like "plumber", filter it.
           // If they chose "restaurant", it might be a mix, so we'll be flexible.
           dbQuery = dbQuery.eq('business_type', type);
        }

        // If not "All Cities", filter by specific city
        if (!isAllCities && normalizedCity) {
          dbQuery = dbQuery.eq('city', normalizedCity);
        }

        const { data: dbLeads, error: dbError } = await dbQuery
          .order('rating', { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (dbError) {
          console.warn('[LEAD FINDER API] DB Search error:', dbError.message);
          hasMore = false;
        } else if (!dbLeads || dbLeads.length === 0) {
          hasMore = false;
        } else {
          allDbLeads = [...allDbLeads, ...dbLeads];
          offset += batchSize;
          if (dbLeads.length < batchSize) hasMore = false;
          // Return up to 20,000 leads for search results (enough for all 9078)
          if (offset >= 20000) hasMore = false;
        }
      }

      if (allDbLeads.length > 0) {
        combinedLeads = allDbLeads.map(l => ({
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
          lastCalledByEmail: l.last_called_by_email || null,
          callStatus: l.call_status || 'fresh',
          nextFollowup: l.next_followup,
        }));
        googlePlaceIdsFound = allDbLeads.map(l => l.google_place_id);
      }
    }

    // 2. STEP 2: Only call Google if we don't have enough leads or force requested
    if (combinedLeads.length < 20 || forceGoogle) {
      // Live Search from Google (Cheap Search API)
      const places = await searchBusinesses(searchQuery);
      
      // Filter by rating locally
      const newGoogleLeads = places
        .filter((p: any) => p.rating != null && p.rating <= maxRating && !googlePlaceIdsFound.includes(p.id))
        .map((p: any) => ({
          id: p.id,
          dbId: null,
          name: p.displayName?.text || 'Unknown',
          address: p.formattedAddress,
          rating: p.rating,
          reviewCount: p.userRatingCount || 0,
          type: type,
          phone: null, // Don't fetch yet to save money
          googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
          website: null,
          timesCalled: 0,
          lastCalledAt: null,
          lastCalledByEmail: null,
          callStatus: 'fresh',
          nextFollowup: null,
          notes: null,
        }));

      combinedLeads = [...combinedLeads, ...newGoogleLeads];
    }

    return NextResponse.json({ 
      leads: combinedLeads.sort((a: any, b: any) => a.rating - b.rating),
      source: combinedLeads.length > googlePlaceIdsFound.length ? 'google+db' : 'db'
    });
  } catch (error) {
    console.error('[LEAD FINDER API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
