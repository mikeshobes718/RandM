import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return new NextResponse('missing id', { status: 400 });
  const supa = getSupabaseAdmin();
  let businessId = id;

  // If id is not a UUID, it might be a source slug
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    const { data: sourceData } = await supa
      .from('review_sources')
      .select('business_id')
      .eq('slug', id)
      .maybeSingle();
    if (sourceData) {
      businessId = sourceData.business_id;
    }
  }

  const columns = 'id,name,google_maps_write_review_uri,review_link,google_place_id,landing_brand_color,landing_button_color,landing_logo_url,landing_headline,landing_subheading';
  let { data, error } = await supa
    .from('businesses')
    .select(columns)
    .eq('id', businessId)
    .maybeSingle();

  // Try to add website if it exists (legacy support)
  if (!error && data) {
    const { data: websiteData } = await supa
      .from('businesses')
      .select('website')
      .eq('id', id)
      .maybeSingle();
    if (websiteData) {
      (data as any).website = (websiteData as any).website;
    }
  }

  if (error) {
    console.error('[PUBLIC BIZ API] Query error:', error);
    return new NextResponse(`Database error: ${error.message}`, { status: 500 });
  }
  if (!data) return new NextResponse('not found', { status: 404 });

  let reviewLink = data.google_maps_write_review_uri || data.review_link || '';
  
  // Robust check for broken Feature ID links
  if (reviewLink.includes('placeid=Ei')) {
    const { makeGoogleReviewLinkFromWriteUri } = await import('@/lib/googlePlaces');
    // If it's a broken link, try to recreate it from the Place ID or just use it as is if we have to.
    // Actually, let's just use the helper which now handles Ei... IDs better.
    reviewLink = makeGoogleReviewLinkFromWriteUri(undefined, data.google_place_id || undefined);
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    reviewLink,
    brandColor: data.landing_brand_color || null,
    buttonColor: data.landing_button_color || null,
    logoUrl: data.landing_logo_url || null,
    headline: data.landing_headline || null,
    subheading: data.landing_subheading || null,
    website: (data as any).website || null,
  });
}
