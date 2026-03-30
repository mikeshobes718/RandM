import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/emailService';
import { reviewRequestEmail } from '@/lib/emailTemplates';
import { getEnv } from '@/lib/env';
import { formatTwilioRestError, getTwilioRestClient, normalizeTwilioFrom } from '@/lib/twilioClient';
import { getEffectiveReplyTo } from '@/lib/replyToEmail';
import { checkReviewRequestQuota } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';


function formatToE164(phone: string): string {
  // Strip everything but digits
  let digits = phone.replace(/\D+/g, '');
  if (digits.length === 10) {
    return '+1' + digits;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  if (phone.startsWith('+')) {
    return '+' + digits;
  }
  return '+' + digits; // Fallback
}

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

    const bodyData = await req.json();
    const { name, type, body: content, targetList } = bodyData;

    if (!name || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const env = getEnv();

    // Get the user's business
    const { data: biz } = await supa
      .from('businesses')
      .select('id, name, review_link, google_place_id')
      .eq('owner_uid', uid)
      .single();

    if (!biz) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Fetch all contacts for this business
    let contactsQuery = supa
      .from('contacts')
      .select('name, email, phone, source, created_at')
      .eq('business_id', biz.id);

    // Apply target list filtering
    if (targetList === 'Square Customers') {
      contactsQuery = contactsQuery.ilike('source', '%square%');
    } else if (targetList === 'Manual Uploads (CSV)') {
      contactsQuery = contactsQuery.in('source', ['manual', 'csv_upload']);
    } else if (targetList === 'Recent Customers (Last 7 Days)') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      contactsQuery = contactsQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { data: contacts, error: contactsErr } = await contactsQuery;

    if (contactsErr) {
      console.error('[CAMPAIGNS CREATE] Error fetching contacts:', contactsErr);
      return NextResponse.json({ error: 'Failed to fetch contacts for campaign' }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No matching contacts found for the selected target list.' }, { status: 400 });
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

    let filteredContacts = contacts;
    
    if (targetList === 'Never Contacted') {
      // Find contacts who have never received a campaign
      // This is a simplified check - ideally we'd track campaign recipients individually
      // For now, we'll just use the standard "hasn't responded" logic as a proxy
      filteredContacts = contacts.filter(c => {
        const emailMatch = c.email && respondedEmails.has(c.email.toLowerCase());
        const phoneMatch = c.phone && respondedPhones.has(c.phone.replace(/\D+/g, ''));
        return !emailMatch && !phoneMatch;
      });
    } else {
      // Standard filter: exclude people who already reviewed/gave feedback
      filteredContacts = contacts.filter(c => {
        const emailMatch = c.email && respondedEmails.has(c.email.toLowerCase());
        const phoneMatch = c.phone && respondedPhones.has(c.phone.replace(/\D+/g, ''));
        return !emailMatch && !phoneMatch;
      });
    }

    if (filteredContacts.length === 0) {
      return NextResponse.json({ error: 'All contacts have already provided feedback or left a review.' }, { status: 400 });
    }

    const pendingSends =
      type === 'Email'
        ? filteredContacts.filter((c) => c.email).length
        : filteredContacts.filter((c) => c.phone).length;
    const quota = await checkReviewRequestQuota(uid, biz.id, pendingSends);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    const replyToAddress = await getEffectiveReplyTo(supa, uid);

    // Process sending
    if (type === 'Email') {
      const emailContacts = filteredContacts.filter(c => c.email);
      if (emailContacts.length === 0) {
        return NextResponse.json({ error: 'No remaining contacts with email addresses found.' }, { status: 400 });
      }

      for (const contact of emailContacts) {
        try {
          const campaignLink = `https://reviewsandmarketing.com/r/${biz.id}?source=campaign`;
          
          // Replace variables in the content body
          let personalizedBody = content
            .replace(/\{\{name\}\}/g, contact.name || 'there')
            .replace(/\{\{business_name\}\}/g, biz.name || 'our business')
            .replace(/\{\{link\}\}/g, campaignLink);

          const { subject, html, text } = reviewRequestEmail(
            contact.name || undefined, 
            personalizedBody, 
            biz.name, 
            campaignLink
          );

          const result = await sendEmail({
            to: contact.email!,
            subject: subject,
            html,
            text: text,
            replyTo: replyToAddress,
          });

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            lastError = result.error || 'Email delivery failed';
          }
        } catch (e: any) {
          console.error(`[CAMPAIGNS CREATE] Failed to send email to ${contact.email}:`, e);
          failedCount++;
          lastError = e.message;
        }
      }
    } else if (type === 'SMS') {
      const smsContacts = filteredContacts.filter(c => c.phone);
      if (smsContacts.length === 0) {
        return NextResponse.json({ error: 'No remaining contacts with phone numbers found.' }, { status: 400 });
      }

      const fromNumber = normalizeTwilioFrom(env.TWILIO_PHONE_NUMBER);

      const twilioResult = getTwilioRestClient(env);
      if (!twilioResult.ok) {
        return NextResponse.json(
          {
            error: `Twilio SMS is not fully configured. ${twilioResult.error}`,
          },
          { status: 400 }
        );
      }

      if (!fromNumber) {
        return NextResponse.json({ error: 'Twilio phone number is missing in environment variables.' }, { status: 400 });
      }

      const twilioClient = twilioResult.client;

      for (const contact of smsContacts) {
        try {
          const campaignLink = `https://reviewsandmarketing.com/r/${biz.id}?source=sms`;
          
          // Replace variables
          let personalizedBody = content
            .replace(/\{\{name\}\}/g, contact.name || 'there')
            .replace(/\{\{business_name\}\}/g, biz.name || 'our business')
            .replace(/\{\{link\}\}/g, campaignLink);

          // Add business name prefix for SMS if not already present
          if (type === 'SMS' && biz.name && !personalizedBody.toLowerCase().includes(biz.name.toLowerCase())) {
            personalizedBody = `${biz.name}: ${personalizedBody}`;
          }

          const toFormatted = formatToE164(contact.phone!);
          console.log('[CAMPAIGNS CREATE] Sending SMS to:', toFormatted, 'original:', contact.phone);
          await twilioClient.messages.create({
            body: personalizedBody,
            from: fromNumber,
            to: toFormatted
          });
          sentCount++;
        } catch (e: unknown) {
          const detail = formatTwilioRestError(e);
          console.error(`[CAMPAIGNS CREATE] SMS failed for ${contact.phone}:`, detail);
          failedCount++;
          lastError = detail;
        }
      }
    }

    // Create the campaign record
    const { data: campaign, error } = await supa
      .from('campaigns')
      .insert({
        business_id: biz.id,
        name,
        type,
        body: content,
        status: 'completed',
        sent_count: sentCount,
        click_count: 0,
        metadata: { failed_count: failedCount, last_error: lastError }
      })
      .select()
      .single();

    if (error) {
      console.error('[CAMPAIGNS CREATE] DB Error:', error);
    }

    return NextResponse.json({ 
      success: true, 
      campaign,
      message: `Campaign processed: ${sentCount} sent, ${failedCount} failed.` 
    });
  } catch (error: any) {
    console.error('[CAMPAIGNS CREATE API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
