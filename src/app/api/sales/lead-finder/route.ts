import { NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/googlePlaces';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const type = searchParams.get('type') || 'bar';
  const query = searchParams.get('query');
  const maxRating = parseFloat(searchParams.get('maxRating') || '4.2');

  const supa = getSupabaseAdmin();

  try {
    let leads = [];

    // If city and type are provided, try querying our database first
    if (city && type) {
      const { data: dbLeads, error: dbError } = await supa
        .from('leads')
        .select('*')
        .eq('business_type', type)
        .eq('city', city.toLowerCase())
        .lte('rating', maxRating)
        .order('rating', { ascending: true });

      if (!dbError && dbLeads && dbLeads.length > 0) {
        leads = dbLeads.map(l => ({
          id: l.google_place_id,
          name: l.name,
          address: l.address,
          rating: l.rating,
          reviewCount: l.review_count,
          type: l.business_type,
        }));
      }
    }

    // If no leads found in DB, fallback to live search
    if (leads.length === 0) {
      const searchQuery = query || (city && type ? `${type} in ${city}` : null);
      if (!searchQuery) return new NextResponse('Missing query or city/type', { status: 400 });

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
        }))
        .sort((a: any, b: any) => a.rating - b.rating);
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[LEAD FINDER API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

