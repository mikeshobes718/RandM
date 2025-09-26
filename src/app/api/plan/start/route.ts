import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireUid, verifyIdTokenViaRest } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { starterWelcomeEmail } from '@/lib/emailTemplates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decodeJwtEmail(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as { email?: string | null };
    return json.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let authInfo: { uid: string; email?: string | null } | null = null;
  let uid = await requireUid().catch(() => null);
  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (token) {
      authInfo = await verifyIdTokenViaRest(token).catch(() => null);
      uid = authInfo?.uid ?? null;
    }
  }
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const supa = getSupabaseAdmin();
  let email = '';

  try {
    const { data, error } = await supa.from('users').select('email').eq('uid', uid).maybeSingle();
    if (error) throw error;
    email = data?.email || '';
  } catch (err) {
    console.error('starter plan lookup user failed', err);
  }

  if (!email) {
    if (!authInfo) {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
      if (token) {
        authInfo = await verifyIdTokenViaRest(token).catch(() => null);
      }
    }
    email = authInfo?.email || '';
    if (!email) {
      try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('idToken')?.value || '';
        if (sessionToken) {
          email = decodeJwtEmail(sessionToken) || '';
        }
      } catch {}
    }
    if (!email) {
      try {
        const auth = getAuthAdmin();
        const userRecord = await auth.getUser(uid);
        email = userRecord.email || '';
      } catch (err) {
        console.error('starter plan firebase lookup failed', err);
      }
    }
    if (email) {
      try {
        const { error } = await supa.from('users').upsert({ uid, email });
        if (error) throw error;
      } catch (err) {
        console.error('starter plan user upsert failed', err);
      }
    }
  }

  try {
    const placeholderId = `starter-${uid}`;
    const now = new Date().toISOString();
    const { error: deleteError } = await supa.from('subscriptions').delete().eq('uid', uid).eq('plan_id', 'starter');
    if (deleteError) throw deleteError;
    const { error: insertError } = await supa
      .from('subscriptions')
      .insert({
        uid,
        stripe_subscription_id: placeholderId,
        plan_id: 'starter',
        status: 'active',
        current_period_end: null,
        updated_at: now,
      });
    if (insertError) throw insertError;

    if (email) {
      try {
        const env = getEnv();
        const postmark = getPostmarkClient();
        const tpl = starterWelcomeEmail(`${env.APP_URL}/onboarding/business`);
        const response = await postmark.sendEmail({
          From: env.EMAIL_FROM,
          To: email,
          Subject: tpl.subject,
          HtmlBody: tpl.html,
          TextBody: tpl.text,
          MessageStream: 'outbound',
        });
        const messageId = (response as unknown as { MessageID?: string }).MessageID || null;
        await supa.from('email_log').insert({
          provider: 'postmark',
          to_email: email,
          template: 'starter_welcome',
          status: 'sent',
          provider_message_id: messageId,
          payload: { subject: tpl.subject },
        });
      } catch (err) {
        console.error('starter welcome email failed', err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('activate starter failed', err);
    const message = err instanceof Error ? err.message : 'Activation failed';
    return new NextResponse(message, { status: 500 });
  }
}
