import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { getEnv } from '@/lib/env';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const billing = (body?.plan as 'monthly'|'yearly') || 'monthly';
    const tier = (body?.tier as 'mid'|'pro') || 'pro';
    const hasConcierge = Boolean(body?.concierge);
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
    const { STRIPE_PRICE_ID, STRIPE_YEARLY_PRICE_ID, STRIPE_MID_PRICE_ID, STRIPE_MID_YEARLY_PRICE_ID, STRIPE_CONCIERGE_PRICE_ID, APP_URL, STRIPE_SECRET_KEY } = env;
    const stripe = getStripeClient();
    
    let priceId = '';
    if (tier === 'mid') {
      priceId = billing === 'yearly' ? STRIPE_MID_YEARLY_PRICE_ID || '' : STRIPE_MID_PRICE_ID || '';
    } else {
      priceId = billing === 'yearly' ? STRIPE_YEARLY_PRICE_ID || '' : STRIPE_PRICE_ID || '';
    }

    const modeLabel = STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // 1. Subscription Line Item
    if (priceId) {
      lineItems.push({ price: priceId, quantity: 1 });
    } else {
      // Fallback
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: tier === 'mid' 
            ? (billing === 'yearly' ? 39000 : 3900) 
            : (billing === 'yearly' ? 79000 : 7900),
          recurring: { interval: (billing === 'yearly' ? 'year' : 'month') as 'month' | 'year' },
          product_data: {
            name: tier === 'mid' ? 'Small Business' : 'Unlimited',
            description: billing === 'yearly' ? 'Annual subscription billed yearly' : 'Monthly subscription billed monthly',
          },
        },
        quantity: 1,
      });
    }

    // 2. Optional Concierge Add-on
    if (hasConcierge) {
      if (STRIPE_CONCIERGE_PRICE_ID) {
        lineItems.push({ price: STRIPE_CONCIERGE_PRICE_ID, quantity: 1 });
      } else {
        // Fallback for one-time fee
        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: 2900,
            product_data: {
              name: 'Concierge Launch',
              description: 'One-time setup assistance',
            },
          },
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${APP_URL}/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing?canceled=1`,
      line_items: lineItems,
      customer_email: email || undefined,
      metadata: { uid, billing, tier, mode: modeLabel, concierge: String(hasConcierge) },
      client_reference_id: uid || undefined,
      allow_promotion_codes: true,
    });

    console.log('[STRIPE CHECKOUT] Session created', { sessionId: session.id, billing, uid, hasConcierge });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('[STRIPE CHECKOUT] Error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return new NextResponse(message, { status: 500 });
  }
}
