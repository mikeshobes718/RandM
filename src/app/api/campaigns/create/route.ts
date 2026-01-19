import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSql } from '@/lib/supabaseAdmin';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/emailService';
import { brandedHtml } from '@/lib/emailTemplates';
import { getEnv } from '@/lib/env';
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
    const { name, type, body: content } = body;

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
    const { data: contacts, error: contactsErr } = await supa
      .from('contacts')
      .select('name, email, phone')
      .eq('business_id', biz.id);

    if (contactsErr) {
      console.error('[CAMPAIGNS CREATE] Error fetching contacts:', contactsErr);
      return NextResponse.json({ error: 'Failed to fetch contacts for campaign' }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found. Please import contacts before starting a campaign.' }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Process sending
    if (type === 'Email') {
      const emailContacts = contacts.filter(c => c.email);
      if (emailContacts.length === 0) {
        return NextResponse.json({ error: 'No contacts with email addresses found.' }, { status: 400 });
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
            text: text
          });

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          console.error(`[CAMPAIGNS CREATE] Failed to send email to ${contact.email}:`, e);
          failedCount++;
        }
      }
    } else if (type === 'SMS') {
      const smsContacts = contacts.filter(c => c.phone);
      if (smsContacts.length === 0) {
        return NextResponse.json({ error: 'No contacts with phone numbers found.' }, { status: 400 });
      }

      // Check for Twilio configuration
      const sid = env.TWILIO_ACCOUNT_SID;
      const token = env.TWILIO_AUTH_TOKEN;
      const apiKeySid = env.TWILIO_API_KEY_SID;
      const apiKeySecret = env.TWILIO_API_KEY_SECRET;
      const fromNumber = env.TWILIO_PHONE_NUMBER;

      if (!sid || (!token && !(apiKeySid && apiKeySecret))) {
        return NextResponse.json({ 
          error: 'SMS provider (Twilio) not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to environment variables.' 
        }, { status: 400 });
      }

      if (!fromNumber) {
        return NextResponse.json({ error: 'TWILIO_PHONE_NUMBER is missing in environment variables.' }, { status: 400 });
      }

      const twilioClient = twilio(apiKeySid || sid, apiKeySecret || token, { accountSid: sid });

      for (const contact of smsContacts) {
        try {
          const campaignLink = `https://reviewsandmarketing.com/r/${biz.id}?source=sms`;
          
          // Replace variables
          let personalizedBody = content
            .replace(/\{\{name\}\}/g, contact.name || 'there')
            .replace(/\{\{business_name\}\}/g, biz.name || 'our business')
            .replace(/\{\{link\}\}/g, campaignLink);

          await twilioClient.messages.create({
            body: personalizedBody,
            from: fromNumber,
            to: contact.phone!
          });
          sentCount++;
        } catch (e: any) {
          console.error(`[CAMPAIGNS CREATE] SMS failed for ${contact.phone}:`, e.message);
          failedCount++;
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
        metadata: { failed_count: failedCount }
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
