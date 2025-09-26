import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseAdmin, getPgPool } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Prefer session cookie; fallback to Authorization: Bearer <idToken>
  let uid: string | null = null;
  let email: string | null = null;
  // Parse body early via clone so we can inspect idToken without consuming the original
  type Body = {
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
  let preParsed: Body | null = null;
  let auth: ReturnType<typeof getAuthAdmin> | null = null;
  try { preParsed = (await req.clone().json()) as Body; } catch {}
  try {
    uid = await requireUid();
  } catch {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;
    const candidate = token || preParsed?.idToken || '';
    let verified = false;
    if (candidate) {
      try {
        auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(candidate);
        uid = decoded.uid;
        email = (decoded as unknown as { email?: string }).email || null;
        verified = true;
      } catch (e) {
        try {
          const viaRest = await verifyIdTokenViaRest(candidate);
          uid = viaRest.uid;
          email = viaRest.email ?? email;
          verified = true;
        } catch {
          // keep verified false so we can fall back to email lookup when possible
        }
        if (!verified && !auth) {
          try { auth = getAuthAdmin(); } catch {}
        }
      }
    }
    if (!verified) {
      const byEmail = preParsed?.email || req.headers.get('x-user-email') || '';
      if (!byEmail) return new NextResponse('Unauthorized', { status: 401 });
      if (!auth) {
        try { auth = getAuthAdmin(); } catch {
          return new NextResponse('Unauthorized', { status: 401 });
        }
      }
      try {
        const u = await auth.getUserByEmail(byEmail);
        uid = u.uid; email = u.email || byEmail;
      } catch (e) {
        console.error('upsert: getUserByEmail failed', e);
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }

  let body: Body;
  try {
    body = preParsed ?? (await req.json());
  } catch (e) {
    console.error('upsert: invalid JSON', e);
    return new NextResponse('Bad Request', { status: 400 });
  }

  const cleanedName = (body.name || '').trim();
  if (!cleanedName) {
    return new NextResponse('Business name required', { status: 400 });
  }
  body.name = cleanedName;
  if (body.contact_phone !== undefined) {
    const digits = normalizePhone(body.contact_phone).slice(0, 10);
    body.contact_phone = digits ? digits : null;
  }
  if (body.address !== undefined) {
    const trimmed = (body.address || '').trim();
    body.address = trimmed ? trimmed : null;
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Ensure a corresponding users row exists to satisfy FK (best‑effort)
  try {
    if (uid) {
      const auth = getAuthAdmin();
      if (!email) {
        try { const u = await auth.getUser(uid); email = u.email || null; } catch {}
      }
      if (!email) {
        // Fallback placeholder to satisfy NOT NULL; will be corrected on next login
        email = `${uid}@user.local`;
      }
      if (email) {
        await supabaseAdmin.from('users').upsert({ uid, email });
      }
    }
  } catch {}

  const timestamp = new Date().toISOString();
  const payloadRow: Record<string, unknown> = {
    owner_uid: uid!,
    name: body.name,
    updated_at: timestamp,
  };
  const maybeAssign = <K extends keyof Body>(key: K, target: string) => {
    const value = body[key];
    if (value !== undefined) {
      payloadRow[target] = value;
    }
  };
  maybeAssign('google_place_id', 'google_place_id');
  maybeAssign('google_maps_place_uri', 'google_maps_place_uri');
  maybeAssign('google_maps_write_review_uri', 'google_maps_write_review_uri');
  maybeAssign('review_link', 'review_link');
  maybeAssign('google_rating', 'google_rating');
  maybeAssign('address', 'address');
  maybeAssign('contact_phone', 'contact_phone');
  let error: PostgrestError | null = null;
  try {
    const r = await supabaseAdmin
      .from('businesses')
      .upsert(payloadRow, { onConflict: 'owner_uid' });
    error = r.error as PostgrestError | null;
    if (error && /foreign key|owner_uid_fkey/i.test(String(error.message || ''))) {
      // Retry once after forcing users row
      try {
        await supabaseAdmin.from('users').upsert({ uid: uid!, email: email || `${uid}@user.local` });
      } catch {}
      const r2 = await supabaseAdmin
        .from('businesses')
        .upsert(payloadRow, { onConflict: 'owner_uid' });
      error = r2.error as PostgrestError | null;
    }
  } catch (e) {
    // Bubble into fallback path
    error = { message: 'fetch failed' } as unknown as PostgrestError;
  }
  // Fallback when unique index is not present yet
  if (error && /ON CONFLICT/.test((error as { message?: string }).message || '')) {
    try {
      const inserted = await supabaseAdmin
        .from('businesses')
        .insert(payloadRow)
        .select('id')
        .single();
      if (!inserted.error && inserted.data?.id) {
        await supabaseAdmin
          .from('businesses')
          .delete()
          .eq('owner_uid', uid!)
          .neq('id', inserted.data.id);
      } else {
        error = inserted.error as PostgrestError | null;
      }
    } catch (e) {
      // keep original error
    }
  }
  try {
    const debugEmail = (process.env.DEBUG_UPSERT_EMAIL || '').toLowerCase();
    const observed = (email || body.email || '').toLowerCase();
    if (debugEmail && observed && observed === debugEmail) {
      console.log('[upsert:debug]', {
        at: new Date().toISOString(),
        uid,
        email: observed,
        hasAuthHeader: Boolean((req.headers.get('authorization') || '').startsWith('Bearer ')),
        usedIdToken: Boolean(preParsed?.idToken),
        error: error?.message || null,
        place: body.google_place_id || null,
        name: body.name || null,
      });
    }
  } catch {}

  if (error) {
    // Fallback to direct Postgres upsert when REST is unavailable
    try {
      const pool = getPgPool();
      if (!pool) throw new Error('pg not configured');
      // Ensure users row exists to satisfy FK
      try {
        if (!email) {
          try { const u = await getAuthAdmin().getUser(uid!); email = u.email || null; } catch {}
        }
        if (email) {
          await pool.query(
            `insert into users (uid, email)
             values ($1, $2)
             on conflict (uid) do update set email = excluded.email`,
            [uid, email]
          );
        }
      } catch {}
      const cols = Object.keys(payloadRow);
      const values = cols.map((key) => {
        const v = payloadRow[key];
        return v === undefined ? null : v;
      });
      const placeholders = cols.map((_, idx) => `$${idx + 1}`);
      const updateCols = cols.filter((col) => col !== 'owner_uid');
      const updates = updateCols.map((col) => `${col} = excluded.${col}`);
      const sql = `insert into businesses (${cols.join(',')})
         values (${placeholders.join(',')})
         on conflict (owner_uid) do update set ${updates.join(', ')}`;
      await pool.query(sql, values);
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)) || (error?.message || 'failed');
      return new NextResponse(`pg fallback failed: ${msg}`, { status: 500 });
    }
  }
  const res = NextResponse.json({ ok: true });
  // Mark onboarding complete for fast client/header gating
  try {
    const host = (() => { try { return new URL(process.env.APP_URL || '').hostname; } catch { try { return new URL(req.url).hostname; } catch { return ''; } } })();
    const domain = host.includes('.') ? `; Domain=.${host.replace(/^www\./,'')}` : '';
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax${domain}`);
  } catch {
    res.headers.set('Set-Cookie', `onboarding_complete=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`);
  }
  return res;
}
