import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/supabaseAdmin';
import { resolveUid } from '@/lib/apiHelpers';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Payload = {
  name: string;
  google_place_id?: string | null;
  google_maps_place_uri?: string | null;
  google_maps_write_review_uri?: string | null;
  review_link?: string | null;
  google_rating?: number | null;
  google_photo_url?: string | null;
  address?: string | null;
  business_type?: string | null;
  contact_phone?: string | null;
  idToken?: string;
  email?: string;
};

async function readPayload(req: Request): Promise<Payload> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    const get = (k: string) => (fd.get(k) as string | null) || undefined;
    const num = (k: string) => { const v = get(k); const n = v ? Number(v) : undefined; return Number.isFinite(n!) ? (n as number) : undefined; };
    return {
      name: get('name') || '',
      google_place_id: get('google_place_id'),
      google_maps_place_uri: get('google_maps_place_uri'),
      google_maps_write_review_uri: get('google_maps_write_review_uri'),
      review_link: get('review_link'),
      google_rating: num('google_rating'),
      google_photo_url: get('google_photo_url'),
      address: get('address'),
      business_type: get('business_type'),
      contact_phone: get('contact_phone'),
      idToken: get('idToken'),
      email: get('email'),
    };
  }
  try { return (await req.json()) as Payload; } catch { return { name: '' }; }
}

function generateSlug(name: string) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  return base || 'business';
}

export async function POST(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) return new NextResponse('Unauthorized', { status: 401 });

    const sql = getSql();
    if (!sql) {
      console.error('[upsert/form] No database connection configured');
      return new NextResponse('Database not configured', { status: 500 });
    }

    const payload = await readPayload(req);
    const email: string | null = payload.email || null;

    const cleanedName = (payload.name || '').trim();
    if (!cleanedName) {
      return new NextResponse('Business name required', { status: 400 });
    }
    payload.name = cleanedName;

    if (payload.contact_phone !== undefined) {
      const digits = normalizePhone(payload.contact_phone).slice(0, 10);
      payload.contact_phone = digits ? digits : null;
    }
    if (payload.address !== undefined) {
      const trimmed = (payload.address || '').trim();
      payload.address = trimmed ? trimmed : null;
    }

    // Ensure users row exists
    if (uid && email) {
      try {
        await sql`
          INSERT INTO users (uid, email) VALUES (${uid}, ${email})
          ON CONFLICT (uid) DO UPDATE SET email = EXCLUDED.email
        `;
      } catch (e) {
        console.warn('[upsert/form] users upsert failed (non-fatal):', e);
      }
    }

    // Check existing business for slug
    const existing = await sql`
      SELECT id, slug FROM businesses WHERE owner_uid = ${uid} LIMIT 1
    `;

    let finalSlug: string;
    if (existing.length > 0 && existing[0].slug) {
      finalSlug = existing[0].slug;
    } else {
      finalSlug = generateSlug(payload.name);
      // Check for slug collisions
      let counter = 1;
      let testSlug = finalSlug;
      while (counter < 10) {
        const conflict = await sql`
          SELECT id FROM businesses WHERE slug = ${testSlug} LIMIT 1
        `;
        if (conflict.length === 0 || (existing.length > 0 && conflict[0].id === existing[0].id)) {
          finalSlug = testSlug;
          break;
        }
        counter++;
        testSlug = `${finalSlug}-${counter}`;
      }
    }

    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update existing business
      await sql`
        UPDATE businesses SET
          name = ${payload.name},
          slug = ${finalSlug},
          google_place_id = COALESCE(${payload.google_place_id ?? null}, google_place_id),
          google_maps_place_uri = COALESCE(${payload.google_maps_place_uri ?? null}, google_maps_place_uri),
          google_maps_write_review_uri = COALESCE(${payload.google_maps_write_review_uri ?? null}, google_maps_write_review_uri),
          review_link = COALESCE(${payload.review_link ?? null}, review_link),
          google_rating = COALESCE(${payload.google_rating ?? null}, google_rating),
          google_photo_url = COALESCE(${payload.google_photo_url ?? null}, google_photo_url),
          address = COALESCE(${payload.address ?? null}, address),
          business_type = COALESCE(${payload.business_type ?? null}, business_type),
          contact_phone = COALESCE(${payload.contact_phone ?? null}, contact_phone),
          updated_at = ${now}
        WHERE id = ${existing[0].id}
      `;
    } else {
      // Insert new business
      await sql`
        INSERT INTO businesses (
          owner_uid, name, slug, google_place_id, google_maps_place_uri,
          google_maps_write_review_uri, review_link, google_rating,
          google_photo_url, address, business_type, contact_phone, updated_at
        ) VALUES (
          ${uid}, ${payload.name}, ${finalSlug},
          ${payload.google_place_id ?? null},
          ${payload.google_maps_place_uri ?? null},
          ${payload.google_maps_write_review_uri ?? null},
          ${payload.review_link ?? null},
          ${payload.google_rating ?? null},
          ${payload.google_photo_url ?? null},
          ${payload.address ?? null},
          ${payload.business_type ?? null},
          ${payload.contact_phone ?? null},
          ${now}
        )
      `;
    }

    // Fetch the saved business
    const rows = await sql`
      SELECT id, name, slug, review_link, google_maps_write_review_uri,
             contact_phone, google_rating, google_place_id, google_photo_url,
             address, business_type
      FROM businesses WHERE owner_uid = ${uid} LIMIT 1
    `;
    const business = rows[0] || null;

    console.log('[upsert/form] Saved:', business ? `${business.name} (id: ${business.id})` : 'null');

    const ct = req.headers.get('content-type') || '';
    const res = (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data'))
      ? NextResponse.redirect(new URL('/dashboard', req.url), 303)
      : NextResponse.json({ ok: true, business });

    try {
      const host = (() => { try { return new URL(process.env.APP_URL || '').hostname; } catch { try { return new URL(req.url).hostname; } catch { return ''; } } })();
      const domain = host.includes('.') ? `; Domain=.${host.replace(/^www\./, '')}` : '';
      res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${domain}`);
    } catch {
      res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);
    }
    return res;
  } catch (err) {
    console.error('[upsert/form] Unhandled error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error — please try again', _debug: String(err) },
      { status: 500 }
    );
  }
}
