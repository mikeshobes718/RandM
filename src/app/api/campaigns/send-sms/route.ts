import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getEnv } from '@/lib/env';
import { formatTwilioRestError, getTwilioRestClient, normalizeTwilioFrom } from '@/lib/twilioClient';
import { checkReviewRequestQuota } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

function formatToE164(phone: string): string {
  let digits = phone.replace(/\D+/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (phone.startsWith('+')) return '+' + digits;
  return '+' + digits;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const supa = getSupabaseAdmin();
    const env = getEnv();

    const { data: biz } = await supa
      .from('businesses')
      .select('id, name, review_link')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const body = await req.json();
    const { recipients, message } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients provided' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const quota = await checkReviewRequestQuota(uid, biz.id, recipients.length);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    const fromRaw = env.TWILIO_PHONE_NUMBER;
    const fromNumber = normalizeTwilioFrom(fromRaw);

    const twilioResult = getTwilioRestClient(env);
    if (!twilioResult.ok) {
      return NextResponse.json({ error: `SMS service not configured. ${twilioResult.error}` }, { status: 400 });
    }

    if (!fromNumber) {
      return NextResponse.json({ error: 'Sending phone number not configured.' }, { status: 400 });
    }

    const twilioClient = twilioResult.client;

    // Auto-prefix business name
    let finalMessage = message;
    if (biz.name && !finalMessage.toLowerCase().includes(biz.name.toLowerCase())) {
      finalMessage = `${biz.name}: ${finalMessage}`;
    }

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;
    const recipientDetails: {
      contact: string;
      status: 'sent' | 'failed';
      error?: string;
      twilioSid?: string;
      /** Twilio initial status (e.g. queued); delivery is async — check Console if not received */
      twilioStatus?: string | null;
    }[] = [];

    for (const phone of recipients) {
      try {
        const toFormatted = formatToE164(phone);
        const created = await twilioClient.messages.create({
          body: finalMessage,
          from: fromNumber,
          to: toFormatted,
        });
        sentCount++;
        recipientDetails.push({
          contact: phone,
          status: 'sent',
          twilioSid: created.sid,
          twilioStatus: created.status ?? null,
        });
      } catch (e: unknown) {
        const detail = formatTwilioRestError(e);
        console.error(`[send-sms] Failed for ${phone}:`, detail);
        failedCount++;
        lastError = detail;
        recipientDetails.push({ contact: phone, status: 'failed', error: lastError });
      }
    }

    // Log EVERY attempt (sent + failed) to contact_messages BEFORE campaign insert
    if (recipientDetails.length > 0) {
      try {
        const messageLogs = recipientDetails.map(r => ({
          business_id: biz.id,
          contact: r.contact,
          channel: 'sms' as const,
          content: finalMessage,
          status: r.status,
          error_message: r.error || null,
        }));
        const { error: insertErr } = await supa.from('contact_messages').insert(messageLogs);
        if (insertErr) {
          console.error('[send-sms] Failed to log messages via REST:', insertErr.message);
        }
      } catch (e) {
        console.error('[send-sms] Failed to log messages:', e);
      }
    }

    // Record campaign
    await supa.from('campaigns').insert({
      business_id: biz.id,
      name: `Direct SMS Outreach (${sentCount} sent)`,
      type: 'SMS',
      body: finalMessage,
      status: 'completed',
      sent_count: sentCount,
      click_count: 0,
      metadata: { failed_count: failedCount, last_error: lastError, recipients: recipientDetails },
    });

    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json({ error: `Failed to send SMS. ${lastError || 'Check phone numbers.'}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      /** Per-recipient Twilio state — "sent" in UI means accepted by Twilio, not necessarily delivered to handset */
      recipients: recipientDetails,
    });
  } catch (err: any) {
    console.error('[send-sms] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
