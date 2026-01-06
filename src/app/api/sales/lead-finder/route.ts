import { NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/googlePlaces';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const maxRating = parseFloat(searchParams.get('maxRating') || '4.2');

  if (!query) {
    return new NextResponse('Missing query', { status: 400 });
  }

  try {
    const places = await searchBusinesses(query);
    
    // Filter for businesses with low ratings
    const leads = places
      .filter((p: any) => p.rating != null && p.rating <= maxRating)
      .map((p: any) => ({
        id: p.id,
        name: p.displayName?.text || 'Unknown',
        address: p.formattedAddress,
        rating: p.rating,
        reviewCount: p.userRatingCount || 0,
      }))
      .sort((a: any, b: any) => a.rating - b.rating);

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[LEAD FINDER API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

