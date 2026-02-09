import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/emailService';
import { reviewRequestEmail } from '@/lib/emailTemplates';
import { getEnv } from '@/lib/env';
import { formatToE164 } from '@/lib/phone';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const env = getEnv();

    // 1. Fetch the original campaign
    const { data: original, error: fetchErr } = await supa
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchErr || !original) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Get the business (verify ownership)
    const { data: biz } = await supa
      .from('businesses')
      .select('id, name, review_link, google_place_id')
      .eq('id', original.business_id)
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'Unauthorized or business not found' }, { status: 403 });
    }

    // 3. Fetch all contacts for this business
    const { data: contacts, error: contactsErr } = await supa
      .from('contacts')
      .select('name, email, phone')
      .eq('business_id', biz.id);

    if (contactsErr || !contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found to resend to.' }, { status: 400 });
    }

    // Filter out contacts who have already left feedback or a review
    const { data: existingFeedback } = await supa
      .from('feedback')
      .select('email, phone')
      .eq('business_id', biz.id);

    const { data: existingEvents } = await supa
      .from('review_events')
      .select('metadata')
      .eq('business_id', biz.id)
      .eq('event', 'google_opened');

    const respondedEmails = new Set(existingFeedback?.map(f => f.email?.toLowerCase()).filter(Boolean));
    const respondedPhones = new Set(existingFeedback?.map(f => f.phone?.replace(/\D+/g, '')).filter(Boolean));

    existingEvents?.forEach(e => {
      const meta = e.metadata as any;
      if (meta?.email) respondedEmails.add(meta.email.toLowerCase());
      if (meta?.phone) respondedPhones.add(meta.phone.replace(/\D+/g, ''));
    });

    const filteredContacts = contacts.filter(c => {
      const emailMatch = c.email && respondedEmails.has(c.email.toLowerCase());
      const phoneMatch = c.phone && respondedPhones.has(c.phone.replace(/\D+/g, ''));
      return !emailMatch && !phoneMatch;
    });

    if (filteredContacts.length === 0) {
      return NextResponse.json({ error: 'All contacts have already provided feedback or left a review.' }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    const { name, type, body: content } = original;
    // Strip all existing (Resend) tags and trim, then add it back once
    const baseName = name.replace(/\(Resend\)/g, '').trim();
    const newName = `${baseName} (Resend)`;

    // 4. Send logic (reused from create/route.ts)
    if (type === 'Email') {
      const emailContacts = filteredContacts.filter(c => c.email);
      for (const contact of emailContacts) {
        try {
          const campaignLink = `https://reviewsandmarketing.com/r/${biz.id}?source=campaign-resend`;
          let personalizedBody = content
            .replace(/\{\{name\}\}/g, contact.name || 'there')
            .replace(/\{\{business_name\}\}/g, biz.name || 'our business')
            .replace(/\{\{link\}\}/g, campaignLink);

          const { subject, html, text } = reviewRequestEmail(contact.name || undefined, personalizedBody, biz.name, campaignLink);
          const result = await sendEmail({ to: contact.email!, subject, html, text });
          if (result.success) sentCount++;
          else { failedCount++; lastError = result.error || 'Email failed'; }
        } catch (e: any) { failedCount++; lastError = e.message; }
      }
    } else if (type === 'SMS') {
      const smsContacts = filteredContacts.filter(c => c.phone);
      const sid = env.TWILIO_ACCOUNT_SID;
      const token = env.TWILIO_AUTH_TOKEN || env.TWILIO_API_KEY_SECRET;
      const apiKeySid = env.TWILIO_API_KEY_SID;
      const fromNumber = env.TWILIO_PHONE_NUMBER;

      if (!sid || (!token && !apiKeySid) || !fromNumber) {
        return NextResponse.json({ error: 'Twilio is not configured' }, { status: 400 });
      }

      const twilioClient = twilio(apiKeySid || sid, token, { accountSid: sid });
      for (const contact of smsContacts) {
        try {
          const campaignLink = `https://reviewsandmarketing.com/r/${biz.id}?source=sms-resend`;
          let personalizedBody = content
            .replace(/\{\{name\}\}/g, contact.name || 'there')
            .replace(/\{\{business_name\}\}/g, biz.name || 'our business')
            .replace(/\{\{link\}\}/g, campaignLink);

          await twilioClient.messages.create({ body: personalizedBody, from: fromNumber, to: formatToE164(contact.phone!) });
          sentCount++;
        } catch (e: any) { failedCount++; lastError = e.message; }
      }
    }

    // 5. Create a NEW campaign record for this resend attempt
    const { data: campaign } = await supa
      .from('campaigns')
      .insert({
        business_id: biz.id,
        name: newName,
        type,
        body: content,
        status: 'completed',
        sent_count: sentCount,
        click_count: 0,
        metadata: { failed_count: failedCount, last_error: lastError, original_campaign_id: campaignId }
      })
      .select()
      .single();

    return NextResponse.json({ 
      success: true, 
      campaign,
      message: `Resend processed: ${sentCount} sent, ${failedCount} failed.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
