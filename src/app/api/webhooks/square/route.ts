import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSquareConnectionForUser, getSquareClient } from '@/lib/square';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { reviewRequestEmail } from '@/lib/emailTemplates';
import { makeGoogleReviewLinkFromWriteUri } from '@/lib/googlePlaces';
import { Client } from 'square';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifySquareSignature(body: string, signature: string, key: string, url: string) {
  if (!key) return true; // Skip if no key configured (not recommended for production)
  const combined = url + body;
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(combined);
  const hash = hmac.digest('base64');
  return hash === signature;
}

export async function POST(req: Request) {
  const env = getEnv();
  const bodyText = await req.text();
  const signature = req.headers.get('x-square-signature') || '';
  const url = env.APP_URL.replace(/\/$/, '') + '/api/webhooks/square';

  if (!verifySquareSignature(bodyText, signature, env.SQUARE_WEBHOOK_SIGNATURE_KEY || '', url)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(bodyText);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  // Handle payment.created or payment.updated
  if (event.type === 'payment.created' || event.type === 'payment.updated') {
    const payment = event.data?.object?.payment;
    if (!payment || payment.status !== 'COMPLETED') {
      return new NextResponse('Payment not completed', { status: 200 });
    }

    const merchantId = event.merchant_id;
    if (!merchantId) return new NextResponse('Missing merchant_id', { status: 200 });

    const supa = getSupabaseAdmin();
    // Find connection by merchant_id
    const { data: connection } = await supa
      .from('square_connections')
      .select('*')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!connection) return new NextResponse('No connection found', { status: 200 });

    if (connection.is_enabled === false) {
      return new NextResponse('Real-time monitoring disabled', { status: 200 });
    }

    const businessId = connection.business_id;
    const { data: business } = await supa
      .from('businesses')
      .select('id, name, review_link, google_maps_write_review_uri, google_place_id')
      .eq('id', businessId)
      .maybeSingle();

    if (!business) return new NextResponse('Business not found', { status: 200 });

    // Try to get customer email from payment
    let customerEmail = payment.customer_details?.email_address;
    let customerName = '';

    // If no email in payment, try to fetch customer from Square API
    if (!customerEmail && payment.customer_id) {
      try {
        const client = getSquareClient(connection);
        const { result } = await client.customersApi.retrieveCustomer(payment.customer_id);
        customerEmail = result.customer?.emailAddress;
        customerName = result.customer?.givenName || '';
      } catch (err) {
        console.error('Failed to fetch Square customer:', err);
      }
    }

    if (!customerEmail) return new NextResponse('No customer email', { status: 200 });

    // Check if we should send a review request (e.g. not sent recently)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // 90 days window
    
    // First, upsert customer in our DB
    const { data: customer } = await supa
      .from('customers')
      .upsert({
        business_id: businessId,
        email: customerEmail.toLowerCase().trim(),
        name: customerName || null,
      }, { onConflict: 'business_id,email' })
      .select('id')
      .maybeSingle();

    if (!customer) return new NextResponse('Failed to upsert customer', { status: 200 });

    const { count } = await supa
      .from('review_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('customer_id', customer.id)
      .gte('created_at', cutoff.toISOString());

    if (count && count > 0) return new NextResponse('Request sent recently', { status: 200 });

    // Send the email
    const link = business.review_link || makeGoogleReviewLinkFromWriteUri(business.google_maps_write_review_uri, business.google_place_id);
    if (!link) return new NextResponse('No review link', { status: 200 });

    const postmark = getPostmarkClient();
    const template = reviewRequestEmail(customerName || 'there', link);
    
    await postmark.sendEmail({
      From: env.EMAIL_FROM,
      To: customerEmail,
      Subject: template.subject,
      HtmlBody: template.html,
      TextBody: template.text,
      MessageStream: 'outbound',
    });

    // Record the request
    await supa.from('review_requests').insert({
      business_id: businessId,
      customer_id: customer.id,
      status: 'sent',
      review_link: link,
    });

    return new NextResponse('Review request sent', { status: 200 });
  }

  return new NextResponse('Event ignored', { status: 200 });
}

