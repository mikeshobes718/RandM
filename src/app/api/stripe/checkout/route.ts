import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { getEnv } from '@/lib/env';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plan = (body?.plan as 'monthly'|'yearly') || 'monthly';
  const env = getEnv();
  // Prefer authenticated uid/email from server if available
  let uid = '';
  let email = '';
  try {
    uid = await requireUid();
    // Require verified email for checkout
    try {
      const auth = getAuthAdmin();
      const u = await auth.getUser(uid);
      if (!u.emailVerified) {
        return new NextResponse('Email not verified', { status: 403 });
      }
    } catch {}
    const supa = getSupabaseAdmin();
    const row = await supa.from('users').select('email').eq('uid', uid).maybeSingle();
    email = row.data?.email || '';
  } catch {
    // If not authenticated via cookie, accept Authorization: Bearer idToken for verification.
    // Otherwise, block checkout entirely for unauthenticated users.
    try {
      const authz = req.headers.get('authorization') || '';
      const tok = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : '';
      if (!tok) {
        return new NextResponse('Authentication required', { status: 401 });
      }
      const auth = getAuthAdmin();
      const dec = await auth.verifyIdToken(tok);
      uid = dec.uid as string;
      const u = await auth.getUser(uid);
      if (!u.emailVerified) return new NextResponse('Email not verified', { status: 403 });
      email = u.email || '';
    } catch {
      return new NextResponse('Authentication required', { status: 401 });
    }
  }
  const { STRIPE_PRICE_ID, STRIPE_YEARLY_PRICE_ID, APP_URL } = env;
  const stripe = getStripeClient();
  const priceId = (plan === 'yearly' && STRIPE_YEARLY_PRICE_ID) ? STRIPE_YEARLY_PRICE_ID : STRIPE_PRICE_ID;
  // Build line item: use a concrete price when available; otherwise inline price_data fallback
  const lineItem = priceId
    ? { price: priceId, quantity: 1 as const }
    : {
        price_data: {
          currency: 'usd',
          unit_amount: plan === 'yearly' ? 49900 : 4999,
          recurring: { interval: (plan === 'yearly' ? 'year' : 'month') as 'month'|'year' },
          product_data: { name: 'Reviews & Marketing Pro' },
        },
        quantity: 1 as const,
      };
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    // Send them to a post-checkout linker that can bind the subscription to their account if not signed in
    success_url: `${APP_URL}/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    line_items: [lineItem],
    customer_email: email || undefined,
    metadata: { uid, plan, mode: 'live' },
    client_reference_id: uid || undefined,
  });
  return NextResponse.json({ url: session.url, id: session.id });
}
