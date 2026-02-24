import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return new NextResponse('missing id', { status: 400 });

  const supa = getSupabaseAdmin();
  const columns = 'id,name,slug,google_maps_write_review_uri,review_link,landing_brand_color,landing_button_color,landing_logo_url,landing_headline,landing_subheading';

  let data: any = null;

  if (uuidRegex.test(id)) {
    // Standard UUID lookup
    const res = await supa.from('businesses').select(columns).eq('id', id).maybeSingle();
    data = res.data;
  } else {
    // Try slug column first
    const slugRes = await supa.from('businesses').select(columns).eq('slug', id).maybeSingle();
    data = slugRes.data;

    // If not found by slug, try matching by name pattern (handles backfill gap)
    if (!data) {
      // Convert slug back to a name pattern: "smart-fit" -> "smart fit"
      const namePattern = id.replace(/-/g, ' ');
      const nameRes = await supa.from('businesses').select(columns).ilike('name', namePattern).maybeSingle();
      data = nameRes.data;
      // Backfill the slug so future lookups are fast
      if (data && !data.slug) {
        const generatedSlug = id; // The slug we searched for IS the correct slug
        try { await supa.from('businesses').update({ slug: generatedSlug }).eq('id', data.id); } catch {}
        data.slug = generatedSlug;
      }
    }
  }

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
