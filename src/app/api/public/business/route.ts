import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE_COLUMNS = 'id,name,google_maps_write_review_uri,review_link,landing_brand_color,landing_button_color,landing_logo_url,landing_headline,landing_subheading';

async function queryBiz(supa: ReturnType<typeof getSupabaseAdmin>, filter: string, value: string) {
  // Try with slug column first, fall back without it if the column doesn't exist
  const withSlug = `${BASE_COLUMNS},slug`;
  const res = await supa.from('businesses').select(withSlug).eq(filter, value).maybeSingle();
  if (res.error && /slug|column|undefined/.test(res.error.message || '')) {
    const fallback = await supa.from('businesses').select(BASE_COLUMNS).eq(filter, value).maybeSingle();
    return fallback.data;
  }
  return res.data;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return new NextResponse('missing id', { status: 400 });

  const supa = getSupabaseAdmin();
  let data: any = null;

  if (uuidRegex.test(id)) {
    data = await queryBiz(supa, 'id', id);
  } else {
    // Try slug column first
    try {
      const slugRes = await supa.from('businesses').select(`${BASE_COLUMNS},slug`).eq('slug', id).maybeSingle();
      if (slugRes.error && /slug|column|undefined/.test(slugRes.error.message || '')) {
        // slug column doesn't exist — skip slug lookup
      } else {
        data = slugRes.data;
      }
    } catch {}

    // Fallback: match by name pattern ("smart-fit" → "smart fit")
    if (!data) {
      const namePattern = id.replace(/-/g, ' ');
      const nameRes = await supa.from('businesses').select(BASE_COLUMNS).ilike('name', namePattern).maybeSingle();
      data = nameRes.data;
      if (data && !data.slug) {
        try { await supa.from('businesses').update({ slug: id }).eq('id', data.id); } catch {}
        data.slug = id;
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
