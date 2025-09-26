import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeClient } from '@/lib/stripe';
import { getEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getPostmarkClient } from '@/lib/postmark';
import { proUpgradeEmail } from '@/lib/emailTemplates';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature') || '';
  const raw = await req.text();

  const env = getEnv();
  const stripe = getStripeClient();
  const postmark = getPostmarkClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const id = event.id as string;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from('webhook_events').select('id').eq('id', id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await supabaseAdmin.from('webhook_events').insert({
    id,
    type: event.type,
    payload: event as unknown,
  });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = (session.metadata?.uid as string) || '';
      const customerId = (session.customer as string) || '';
      const subscriptionId = (session.subscription as string) || '';
      if (uid && customerId) {
        await supabaseAdmin
          .from('stripe_customers')
          .upsert({ uid, stripe_customer_id: customerId });
      }
      if (uid && subscriptionId) {
        try {
          const sub = (await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.price'] })) as unknown as Stripe.Subscription;
          const price = sub.items.data[0]?.price as Stripe.Price | undefined;
          const priceId = price?.id || '';
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              uid,
              stripe_subscription_id: subscriptionId,
              plan_id: priceId,
              status: sub.status,
              current_period_end: new Date((((sub as unknown) as { current_period_end?: number }).current_period_end || 0) * 1000).toISOString(),
            }, { onConflict: 'stripe_subscription_id' });
          // Mark any Starter placeholders as upgraded
          try {
            await supabaseAdmin
              .from('subscriptions')
              .delete()
              .eq('uid', uid)
              .eq('plan_id', 'starter');
          } catch {}
          // Send upgrade email
          try {
            const { data } = await supabaseAdmin.from('users').select('email').eq('uid', uid).maybeSingle();
            const email = data?.email || '';
            if (email) {
              const tpl = proUpgradeEmail(`${env.APP_URL}/dashboard`);
              const response = await postmark.sendEmail({
                From: env.EMAIL_FROM,
                To: email,
                Subject: tpl.subject,
                HtmlBody: tpl.html,
                TextBody: tpl.text,
                MessageStream: 'outbound',
              });
              const messageId = (response as unknown as { MessageID?: string }).MessageID || null;
              await supabaseAdmin.from('email_log').insert({
                provider: 'postmark',
                to_email: email,
                template: 'pro_upgrade',
                status: 'sent',
                provider_message_id: messageId,
                payload: { subject: tpl.subject },
              });
            }
          } catch (emailErr) {
            console.error('pro upgrade email failed', emailErr);
          }
        } catch {}
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = (sub.customer as string) || '';
      const price = sub.items.data[0]?.price as Stripe.Price | undefined;
      const priceId = price?.id || '';
      // Find uid for this customer
      let uid = '';
      try {
        const { data } = await supabaseAdmin
          .from('stripe_customers')
          .select('uid')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        uid = data?.uid || '';
      } catch {}
      if (!uid) {
        // Backfill by customer email if present
        try {
          const cust = await stripe.customers.retrieve(customerId);
          const email = (cust as unknown as { email?: string })?.email;
          if (email) {
            const { data: user } = await supabaseAdmin.from('users').select('uid').eq('email', email).maybeSingle();
            if (user?.uid) {
              uid = user.uid;
              await supabaseAdmin.from('stripe_customers').upsert({ uid, stripe_customer_id: customerId });
            }
          }
        } catch {}
      }
      if (uid) {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            uid,
            stripe_subscription_id: sub.id,
            plan_id: priceId,
            status: sub.status,
            current_period_end: new Date((((sub as unknown) as { current_period_end?: number }).current_period_end || 0) * 1000).toISOString(),
          }, { onConflict: 'stripe_subscription_id' });
        try {
          await supabaseAdmin
            .from('subscriptions')
            .delete()
            .eq('uid', uid)
            .eq('plan_id', 'starter');
        } catch {}
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
