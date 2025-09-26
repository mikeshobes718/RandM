import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let uid: string | null = await requireUid().catch(() => null);
  const body = await req.json().catch(() => ({}));
  const sessionId = String(body?.session_id || '').trim();
  if (!sessionId) return new NextResponse('Missing session_id', { status: 400 });
  // Fallback auth: Authorization: Bearer <idToken> or idToken in body
  if (!uid) {
    try {
      const authHeader = req.headers.get('authorization') || '';
      const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
      const idTok = String(body?.idToken || bearer || '');
      if (idTok) {
        const dec = await getAuthAdmin().verifyIdToken(idTok);
        uid = dec.uid;
      }
    } catch {}
  }
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const stripe = getStripeClient();
  let session: Stripe.Checkout.Session | null = null;
  try {
    // Expand subscription to read price/status
    session = (await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'customer'] })) as unknown as Stripe.Checkout.Session;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'stripe-error';
    return new NextResponse(`Stripe error: ${msg}`, { status: 400 });
  }
  const customerId = (session.customer as string) || '';
  const sub = session.subscription as unknown as Stripe.Subscription | null;
  const subId = sub?.id || '';
  const price = sub?.items?.data?.[0]?.price as Stripe.Price | undefined;
  const priceId = price?.id || '';
  const status = ((sub as unknown) as { status?: string })?.status || (session.status as unknown as string) || 'active';

  const supa = getSupabaseAdmin();
  if (customerId) {
    await supa.from('stripe_customers').upsert({ uid, stripe_customer_id: customerId });
  }
  if (subId) {
    await supa.from('subscriptions').upsert({
      uid,
      stripe_subscription_id: subId,
      plan_id: priceId || 'unknown',
      status,
      current_period_end: (((sub as unknown) as { current_period_end?: number })?.current_period_end ? new Date(((((sub as unknown) as { current_period_end?: number }).current_period_end as number) * 1000)).toISOString() : null),
    }, { onConflict: 'stripe_subscription_id' });
  }

  return NextResponse.json({ ok: true, linked: Boolean(customerId), subscription: Boolean(subId) });
}
