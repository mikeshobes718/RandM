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

  const supa = getSupabaseAdmin();

  try {
    let leads = [];

    // If city and type are provided, try querying our database first
    if (city && type) {
      let dbQuery = supa
        .from('leads')
        .select('*')
        .eq('business_type', type)
        .eq('city', city.toLowerCase())
        .lte('rating', maxRating);
      
      if (state) dbQuery = dbQuery.eq('state', state);
      if (country) dbQuery = dbQuery.eq('country', country);
      
      const { data: dbLeads, error: dbError } = await dbQuery.order('rating', { ascending: true });

      if (!dbError && dbLeads && dbLeads.length > 0) {
        leads = dbLeads.map(l => ({
          id: l.google_place_id,
          name: l.name,
          address: l.address,
          rating: l.rating,
          reviewCount: l.review_count,
          type: l.business_type,
          phone: l.phone,
        }));
      }
    }

    // If no leads found in DB, fallback to live search
    if (leads.length === 0) {
      const location = [city, state, country].filter(Boolean).join(', ');
      const searchQuery = query || (location && type ? `${type} in ${location}` : null);
      if (!searchQuery) return new NextResponse('Missing query or location', { status: 400 });

      const places = await searchBusinesses(searchQuery);
      leads = places
        .filter((p: any) => p.rating != null && p.rating <= maxRating)
        .map((p: any) => ({
          id: p.id,
          name: p.displayName?.text || 'Unknown',
          address: p.formattedAddress,
          rating: p.rating,
          reviewCount: p.userRatingCount || 0,
          type: type || (p.primaryType ? p.primaryType.replace(/_/g, ' ') : p.types?.[0]?.replace(/_/g, ' ')),
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber || 'No Phone',
        }))
        .sort((a: any, b: any) => a.rating - b.rating);
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[LEAD FINDER API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

