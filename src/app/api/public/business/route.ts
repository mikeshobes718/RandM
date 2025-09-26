import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return new NextResponse('missing id', { status: 400 });
  const supa = getSupabaseAdmin();
  const columns = 'id,name,google_maps_write_review_uri,review_link,landing_brand_color,landing_button_color,landing_logo_url,landing_headline,landing_subheading';
  let { data, error } = await supa
    .from('businesses')
    .select(columns)
    .eq('id', id)
    .maybeSingle();

  if (error && /column/.test(error.message || '')) {
    const fallback = await supa
      .from('businesses')
      .select('id,name,review_link')
      .eq('id', id)
      .maybeSingle();
    if (fallback.data) data = { ...fallback.data } as typeof data;
    error = fallback.error ?? null;
  }

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return new NextResponse('not found', { status: 404 });
  return NextResponse.json({
    id: data.id,
    name: data.name,
    reviewLink: data.google_maps_write_review_uri || data.review_link || '',
    brandColor: data.landing_brand_color || null,
    buttonColor: data.landing_button_color || null,
    logoUrl: data.landing_logo_url || null,
    headline: data.landing_headline || null,
    subheading: data.landing_subheading || null,
  });
}
