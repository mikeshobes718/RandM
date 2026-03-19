import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
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

export async function POST(req: NextRequest) {
 try {
  const uid = await resolveUid(req);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const payload = await readPayload(req);
  let email: string | null = payload.email || null;

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

  const supabase = getSupabaseAdmin();
  try {
    if (uid && email) { await supabase.from('users').upsert({ uid, email }); }
  } catch {}

  // Auto-generate a URL-friendly slug from the business name
  const generateSlug = (name: string) => {
    const base = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    return base || 'business';
  };

  let finalSlug = generateSlug(payload.name);
  
  // Check for existing slug and handle collisions
  try {
    const { data: existingBiz } = await supabase.from('businesses').select('id, slug').eq('owner_uid', uid!).maybeSingle();
    
    // If they already have a slug, keep it unless they changed their name significantly
    if (existingBiz && existingBiz.slug) {
      finalSlug = existingBiz.slug;
    } else {
      // Need to generate a new unique slug
      let isUnique = false;
      let counter = 1;
      let testSlug = finalSlug;
      
      while (!isUnique && counter < 10) {
        const { data: conflict } = await supabase.from('businesses').select('id').eq('slug', testSlug).maybeSingle();
        if (!conflict || (existingBiz && conflict.id === existingBiz.id)) {
          isUnique = true;
          finalSlug = testSlug;
        } else {
          counter++;
          testSlug = `${finalSlug}-${counter}`;
        }
      }
    }
  } catch (e) {
    console.error('Error checking slug collision:', e);
  }

  const payloadRow: Record<string, unknown> = {
    owner_uid: uid!,
    name: payload.name,
    slug: finalSlug,
    updated_at: new Date().toISOString(),
  };
  const maybeAssign = <K extends keyof Payload>(key: K, target: string) => {
    const value = payload[key];
    if (value !== undefined) payloadRow[target] = value;
  };
  maybeAssign('google_place_id', 'google_place_id');
  maybeAssign('google_maps_place_uri', 'google_maps_place_uri');
  maybeAssign('google_maps_write_review_uri', 'google_maps_write_review_uri');
  maybeAssign('review_link', 'review_link');
  maybeAssign('google_rating', 'google_rating');
  maybeAssign('google_photo_url', 'google_photo_url');
  maybeAssign('address', 'address');
  maybeAssign('business_type', 'business_type');
  maybeAssign('contact_phone', 'contact_phone');

  let { error }: { error: PostgrestError | null } = await supabase.from('businesses').upsert(payloadRow, { onConflict: 'owner_uid' });
  
  // Fallback if upsert fails (e.g., if owner_uid is not a unique constraint but we want to treat it as one)
  if (error && /ON CONFLICT/.test((error as { message?: string }).message || '')) {
    try {
      // Find existing business
      const { data: existing } = await supabase.from('businesses').select('id').eq('owner_uid', uid!).maybeSingle();
      
      if (existing) {
        // Update existing to prevent data loss (cascading deletes)
        const { error: updateError } = await supabase
          .from('businesses')
          .update(payloadRow)
          .eq('id', existing.id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('businesses')
          .insert(payloadRow);
        error = insertError;
      }
    } catch (e: any) {
      error = e;
    }
  }
  if (error) return new NextResponse(error.message, { status: 500 });
  
  // Fetch the business data we just created/updated to return it
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('id,name,review_link,google_maps_write_review_uri,contact_phone,google_rating,google_place_id')
    .eq('owner_uid', uid!)
    .maybeSingle();
  
  if (fetchError) {
    console.error('[upsert/form] Failed to fetch business after save:', fetchError);
  }
  
  const ct = req.headers.get('content-type') || '';
  
  // Log for debugging
  console.log('[upsert/form] Returning business data:', business ? `${business.name} (id: ${business.id})` : 'null');
  
  const res = (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data'))                                                          
    ? NextResponse.redirect(new URL('/dashboard', req.url), 303)
    : NextResponse.json({ ok: true, business: business || null });
  try {
    const host = (() => { try { return new URL(process.env.APP_URL || '').hostname; } catch { try { return new URL(req.url).hostname; } catch { return ''; } } })();                                                                            
    const domain = host.includes('.') ? `; Domain=.${host.replace(/^www\./,'')}` : '';                                                                          
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax${domain}`);                                             
  } catch {
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`);                                                      
  }
  return res;
 } catch (err) {
  console.error('[upsert/form] Unhandled error:', err);
  return new NextResponse('Server error — please try again', { status: 500 });
 }
}
