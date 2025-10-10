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
    const { STRIPE_PRICE_ID, STRIPE_YEARLY_PRICE_ID, APP_URL, STRIPE_SECRET_KEY } = env;
    const stripe = getStripeClient();
    const priceId = plan === 'yearly' ? STRIPE_YEARLY_PRICE_ID : STRIPE_PRICE_ID;
    const modeLabel = STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test';

    const fallbackLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: 'usd',
        unit_amount: plan === 'yearly' ? 49900 : 4999,
        recurring: { interval: (plan === 'yearly' ? 'year' : 'month') as 'month' | 'year' },
        product_data: {
          name: 'Reviews & Marketing Pro',
          description: plan === 'yearly' ? 'Annual subscription billed yearly' : 'Monthly subscription billed monthly',
        },
      },
      quantity: 1 as const,
    };

    const preferredLineItem: Stripe.Checkout.SessionCreateParams.LineItem | null = priceId
      ? { price: priceId, quantity: 1 as const }
      : null;

    const createSession = async (lineItem: Stripe.Checkout.SessionCreateParams.LineItem) =>
      stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${APP_URL}/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/pricing?canceled=1`,
        line_items: [lineItem],
        customer_email: email || undefined,
        metadata: { uid, plan, mode: modeLabel },
        client_reference_id: uid || undefined,
        allow_promotion_codes: true,
      });

    let session: Stripe.Checkout.Session;
    let usedFallback = false;

    try {
      const initialLineItem = preferredLineItem ?? fallbackLineItem;
      console.log('[STRIPE CHECKOUT] Creating session with preferred line item', { uid, plan, priceId });
      session = await createSession(initialLineItem);
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      const message = stripeError?.message || String(error);
      const isPriceError =
        message.includes('No such price') ||
        message.includes('test mode key') ||
        message.includes('You provided a testmode key') ||
        message.includes('You cannot provide a price') ||
        stripeError?.code === 'resource_missing';

      if (!isPriceError && preferredLineItem) {
        console.error('[STRIPE CHECKOUT] Failed to create session with preferred price ID', {
          plan,
          priceId,
          code: stripeError?.code,
          message,
        });
        throw error;
      }

      console.warn('[STRIPE CHECKOUT] Falling back to inline price data for checkout', {
        plan,
        priceId,
        code: stripeError?.code,
        message,
      });
      session = await createSession(fallbackLineItem);
      usedFallback = true;
    }

    console.log('[STRIPE CHECKOUT] Session created', { sessionId: session.id, usedFallback, plan, uid });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('[STRIPE CHECKOUT] Error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return new NextResponse(message, { status: 500 });
  }
}
