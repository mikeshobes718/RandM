import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
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
  address?: string | null;
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
      address: get('address'),
      contact_phone: get('contact_phone'),
      idToken: get('idToken'),
      email: get('email'),
    };
  }
  try { return (await req.json()) as Payload; } catch { return { name: '' }; }
}

export async function POST(req: Request) {
  // Auth: prefer session cookie; else idToken from header/body/form
  let uid: string | null = null;
  let email: string | null = null;
  let payload: Payload | null = null;
  try { uid = await requireUid(); } catch {}
  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    payload = await readPayload(req);
    const candidate = bearer || payload?.idToken || '';
    if (!candidate) return new NextResponse('Unauthorized', { status: 401 });
    let auth: ReturnType<typeof getAuthAdmin> | null = null;
    try {
      auth = getAuthAdmin();
      try {
        const decoded = await auth.verifyIdToken(candidate);
        uid = decoded.uid;
        email = (decoded as unknown as { email?: string }).email || null;
      } catch {
        if (!payload?.email) throw new Error('no-auth');
        const u = await auth.getUserByEmail(payload.email);
        uid = u.uid;
        email = u.email || payload.email;
      }
    } catch {
      try {
        const viaRest = await verifyIdTokenViaRest(candidate);
        uid = viaRest.uid;
        email = viaRest.email ?? payload?.email ?? null;
      } catch {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }
  if (!payload) payload = await readPayload(req);

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
  // Ensure users row exists
  try {
    if (uid) {
      if (!email) {
        try { const u = await getAuthAdmin().getUser(uid); email = u.email || null; } catch {}
      }
      if (email) { await supabase.from('users').upsert({ uid, email }); }
    }
  } catch {}

  const payloadRow: Record<string, unknown> = {
    owner_uid: uid!,
    name: payload.name,
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
  maybeAssign('address', 'address');
  maybeAssign('contact_phone', 'contact_phone');

  let { error }: { error: PostgrestError | null } = await supabase.from('businesses').upsert(payloadRow, { onConflict: 'owner_uid' });
  if (error && /ON CONFLICT/.test((error as { message?: string }).message || '')) {
    try {
      const inserted = await supabase
        .from('businesses')
        .insert({
          owner_uid: uid!,
          name: payload.name,
          google_place_id: payload.google_place_id,
          review_link: payload.review_link,
          google_rating: payload.google_rating,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (!inserted.error && inserted.data?.id) {
        await supabase
          .from('businesses')
          .delete()
          .eq('owner_uid', uid!)
          .neq('id', inserted.data.id);
        error = null;
      }
    } catch {}
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
  
  // Check if this is an edit request by looking for edit parameter in referer
  const referer = req.headers.get('referer') || '';
  const isEditRequest = referer.includes('edit=1');
  
  const res = (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data'))                                                          
    ? NextResponse.redirect(new URL(isEditRequest ? '/dashboard?from=edit' : '/dashboard', req.url), 303)
    : NextResponse.json({ ok: true, business: business || null });
  try {
    const host = (() => { try { return new URL(process.env.APP_URL || '').hostname; } catch { try { return new URL(req.url).hostname; } catch { return ''; } } })();                                                                            
    const domain = host.includes('.') ? `; Domain=.${host.replace(/^www\./,'')}` : '';                                                                          
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax${domain}`);                                             
  } catch {
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`);                                                      
  }
  return res;
}
