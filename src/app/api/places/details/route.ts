import { NextResponse } from 'next/server';
import { getPlaceDetails, makeGoogleReviewLinkFromWriteUri } from '@/lib/googlePlaces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Force redeploy to sync photoUrl
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');
  const sessionToken = searchParams.get('sessionToken') || undefined;

  if (!placeId) return new NextResponse('Missing placeId', { status: 400 });
  const p = await getPlaceDetails(placeId, sessionToken);
  console.log('[API/PLACES/DETAILS] p keys:', Object.keys(p));
  console.log('[API/PLACES/DETAILS] photoUrl present:', !!(p as any).photoUrl);
  
  const links = (p as any).googleMapsLinks || {};
  return NextResponse.json({
    id: (p as any).id,
    displayName: (p as any).displayName?.text,
    formattedAddress: (p as any).formattedAddress,
    rating: (p as any).rating,
    userRatingCount: (p as any).userRatingCount,
    googleMapsUri: (p as any).googleMapsUri,
    photoUrl: (p as any).photoUrl,
    writeAReviewUri: makeGoogleReviewLinkFromWriteUri(links.writeAReviewUri, (p as any).id),
    reviewsUri: links.reviewsUri,
    lat: (p as any).location?.latitude,
    lng: (p as any).location?.longitude,
  });
}
