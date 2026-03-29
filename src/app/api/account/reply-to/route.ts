import { NextRequest, NextResponse } from 'next/server';
import { resolveUid } from '@/lib/apiHelpers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { normalizeReplyToInput } from '@/lib/replyToEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Set optional Reply-To for customer-facing email outreach.
 * Empty / null clears the override (sign-in email is used).
 */
export async function PATCH(req: NextRequest) {
  try {
    const uid = await resolveUid(req);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const raw = body as { replyToEmail?: string | null };
    if (!('replyToEmail' in raw)) {
      return NextResponse.json({ error: 'Missing replyToEmail' }, { status: 400 });
    }

    const normalized = normalizeReplyToInput(
      raw.replyToEmail === null || raw.replyToEmail === undefined ? null : String(raw.replyToEmail)
    );

    if (normalized && !EMAIL_RE.test(normalized)) {
      return NextResponse.json({ error: 'Enter a valid email address, or leave blank to use your sign-in email.' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const { data: existing } = await supa.from('users').select('uid').eq('uid', uid).maybeSingle();

    if (existing) {
      const { error } = await supa.from('users').update({ reply_to_email: normalized }).eq('uid', uid);
      if (error) {
        console.error('[account/reply-to] update failed:', error.message);
        return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 });
      }
    } else {
      const auth = getAuthAdmin();
      const fb = await auth.getUser(uid);
      const email = fb.email || `${uid}@user.local`;
      const { error } = await supa.from('users').upsert(
        { uid, email, reply_to_email: normalized, role: 'customer' },
        { onConflict: 'uid' }
      );
      if (error) {
        console.error('[account/reply-to] upsert failed:', error.message);
        return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, replyToEmail: normalized });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
