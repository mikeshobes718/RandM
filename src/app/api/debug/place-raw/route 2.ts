import { NextResponse } from 'next/server';
import { getPlaceDetails } from '@/lib/googlePlaces';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');
  if (!placeId) return new NextResponse('Missing placeId', { status: 400 });
  const details = await getPlaceDetails(placeId);
  return NextResponse.json({ 
    details, 
    hasPhotos: !!(details as any).photos, 
    photoUrl: (details as any).photoUrl 
  });
}

