import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

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

export async function POST(req: Request) {
  console.log('[UPSERT/FORM] Request received from:', req.headers.get('referer') || 'unknown');
  console.log('[UPSERT/FORM] Request method:', req.method);
  console.log('[UPSERT/FORM] Content-Type:', req.headers.get('content-type'));

  // Auth: prefer session cookie; else idToken from header/body/form
  let uid: string | null = null;
  let email: string | null = null;
  let payload: Payload | null = null;
  try { uid = await requireUid(); } catch (e) {
    console.log('[UPSERT/FORM] requireUid failed:', e);
  }
  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    payload = await readPayload(req);
    const candidate = bearer || payload?.idToken || '';
    if (!candidate) {
      console.error('[UPSERT/FORM] No auth token found');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    let auth: ReturnType<typeof getAuthAdmin> | null = null;
    try {
      auth = getAuthAdmin();
      try {
        const decoded = await auth.verifyIdToken(candidate);
        uid = decoded.uid;
        email = (decoded as unknown as { email?: string }).email || null;
        console.log('[UPSERT/FORM] Auth verified via Firebase Admin, UID:', uid);
      } catch (verifyErr) {
        console.log('[UPSERT/FORM] Firebase verifyIdToken failed:', verifyErr);
        if (!payload?.email) throw new Error('no-auth');
        const u = await auth.getUserByEmail(payload.email);
        uid = u.uid;
        email = u.email || payload.email;
        console.log('[UPSERT/FORM] Auth recovered via email lookup, UID:', uid);
      }
    } catch (adminErr) {
      console.log('[UPSERT/FORM] Firebase Admin failed, trying REST:', adminErr);
      try {
        const viaRest = await verifyIdTokenViaRest(candidate);
        uid = viaRest.uid;
        email = viaRest.email ?? payload?.email ?? null;
        console.log('[UPSERT/FORM] Auth verified via REST, UID:', uid);
      } catch (restErr) {
        console.error('[UPSERT/FORM] REST auth also failed:', restErr);
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }
  if (!payload) payload = await readPayload(req);
  
  console.log('[UPSERT/FORM] Authenticated UID:', uid);
  console.log('[UPSERT/FORM] Business name:', payload.name);

  const cleanedName = (payload.name || '').trim();
  if (!cleanedName) {
    return new NextResponse('Business name required', { status: 400 });
  }
  payload.name = cleanedName;
  if (payload.contact_phone !== undefined) {
    let digits = normalizePhone(payload.contact_phone);
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    payload.contact_phone = digits.slice(0, 10) || null;
  }
  if (payload.address !== undefined) {
    const trimmed = (payload.address || '').trim();
    payload.address = trimmed ? trimmed : null;
  }

  const supabase = getSupabaseAdmin();

  // Check plan status before allowing business creation
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('uid', uid!)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // If no active plan found, block unless it's an edit request
    const referer = req.headers.get('referer') || '';
    const isEditRequest = referer.includes('edit=1');
    
    // RELAXED PLAN CHECK: If they are on the onboarding page with a plan in the URL, allow it
    const isOnboardingWithPlan = referer.includes('/onboarding/business') && referer.includes('plan=');
    
    // Co-founder override for plan check
    const coFounders = ['bladespindler@gmail.com', 'volurer295@ovbest.com'];
    
    // Ensure we have an email if we only have a UID
    if (uid && !email) {
      try {
        const u = await getAuthAdmin().getUser(uid);
        email = u.email || null;
      } catch (e) {
        console.log('[UPSERT/FORM] Failed to fetch email for override check:', e);
      }
    }

    const isOverride = email && coFounders.includes(email.toLowerCase());
    
    if (!isEditRequest && !isOnboardingWithPlan && !isOverride && (!sub || sub.status.toLowerCase() !== 'active')) {
      const { data: existingBiz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_uid', uid!)
        .maybeSingle();
      
      if (!existingBiz) {
        return new NextResponse('Please select a plan first', { status: 403 });
      }
    }
  } catch (err) {
    console.error('[upsert/form] Plan check error:', err);
  }

  // Ensure users row exists
  try {
    if (uid) {
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
  maybeAssign('google_photo_url', 'google_photo_url');
  maybeAssign('address', 'address');
  maybeAssign('business_type', 'business_type');
  maybeAssign('contact_phone', 'contact_phone');

  let { error }: { error: PostgrestError | null } = await supabase.from('businesses').upsert(payloadRow, { onConflict: 'owner_uid' });
  
  if (error && (error.message.includes('google_photo_url') || error.message.includes('address') || error.message.includes('business_type'))) {
    // Retry without the new columns if they are causing schema cache errors
    const fallbackRow = { ...payloadRow };
    delete fallbackRow.google_photo_url;
    delete fallbackRow.address;
    delete fallbackRow.business_type;
    const retry = await supabase.from('businesses').upsert(fallbackRow, { onConflict: 'owner_uid' });
    error = retry.error;
  }

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
  let business: any = null;
  const bizFetch = await supabase
    .from('businesses')
    .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone,google_photo_url,address,business_type')
    .eq('owner_uid', uid!)
    .maybeSingle();
  
  if (bizFetch.error) {
    if (bizFetch.error.message.includes('google_photo_url') || bizFetch.error.message.includes('address') || bizFetch.error.message.includes('business_type')) {
      const fallback = await supabase
        .from('businesses')
        .select('id,name,review_link,google_maps_write_review_uri,google_rating,google_place_id,contact_phone')
        .eq('owner_uid', uid!)
        .maybeSingle();
      business = fallback.data;
    } else {
      console.error('[upsert/form] Failed to fetch business after save:', bizFetch.error);
    }
  } else {
    business = bizFetch.data;
  }
  
  const ct = req.headers.get('content-type') || '';
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
