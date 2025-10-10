import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripeClient } from '@/lib/stripe';
import { getEnv } from '@/lib/env';
import { getAuthAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let uid = await requireUid().catch(() => null);

  const body = (await req.json().catch(() => null)) as { idToken?: string } | null;

  if (!uid) {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    const token = body?.idToken || bearer;
    if (token) {
      try {
        const auth = getAuthAdmin();
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid as string;
      } catch {}
    }
  }

  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const supa = getSupabaseAdmin();
  const { data: existing } = await supa
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('uid', uid)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id || '';
  const stripe = getStripeClient();

  if (!customerId) {
    const { data: sub } = await supa
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('uid', uid)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const subscriptionId = sub?.stripe_subscription_id || '';
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['customer'] });
        const customer = subscription.customer;
        if (typeof customer === 'string') {
          customerId = customer;
        } else if (customer && typeof customer === 'object' && 'id' in customer && typeof (customer as { id?: unknown }).id === 'string') {
          customerId = (customer as { id: string }).id;
        }
        if (customerId) {
          await supa.from('stripe_customers').upsert({ uid, stripe_customer_id: customerId });
        }
      } catch {}
    }
  }

  if (!customerId) {
    // Attempt to resolve or create a customer by email
    try {
      const auth = getAuthAdmin();
      const user = await auth.getUser(uid);
      const email = user.email || undefined;
      if (email) {
        // Try to find an existing Stripe customer by email first
        try {
          const list = await stripe.customers.list({ email, limit: 5 });
          const found = list.data.find((c) => (c.email || '').toLowerCase() === email.toLowerCase());
          if (found?.id) {
            customerId = found.id;
          }
        } catch {}

        if (!customerId) {
          const created = await stripe.customers.create({ email, metadata: { uid } });
          customerId = created.id;
        }

        if (customerId) {
          await supa.from('stripe_customers').upsert({ uid, stripe_customer_id: customerId });
        }
      }
    } catch {}
  }

  if (!customerId) {
    return new NextResponse('Stripe customer not found', { status: 404 });
  }

  const { APP_URL, STRIPE_PORTAL_CONFIGURATION_ID } = getEnv();
  const portalConfigId = STRIPE_PORTAL_CONFIGURATION_ID || undefined;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/dashboard`,
    ...(portalConfigId ? { configuration: portalConfigId } : {}),
  });
  return NextResponse.json({ url: session.url });
}
