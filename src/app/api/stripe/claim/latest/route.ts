import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { requireUid } from '@/lib/authServer';
import { getAuthAdmin } from '@/lib/firebaseAdmin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUid(req: Request): Promise<string|null> {
  const uidFromCookie: string | null = await requireUid().catch(() => null);
  if (uidFromCookie) return uidFromCookie;
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (token) { const dec = await getAuthAdmin().verifyIdToken(token); return (dec.uid as string) || null; }
  } catch {}
  return null;
}

async function handle(req: Request) {
  // Auth (cookie or Bearer token)
  const uid = await getUid(req);
  let email: string = '';
  if (uid) {
    try { const u = await getAuthAdmin().getUser(uid); email = u.email || ''; } catch {}
    if (!email) {
      try { const { data } = await getSupabaseAdmin().from('users').select('email').eq('uid', uid).maybeSingle(); email = data?.email || ''; } catch {}
    }
  }
  if (!email) return new NextResponse('Unauthorized', { status: 401 });

  const stripe = getStripeClient();
  // Find or create customer by email
  let customer: Stripe.Customer | null = null;
  try {
    // Prefer search API for more reliable matching
    // Note: requires Stripe accounts with search enabled
    // Fallbacks to list if search is unavailable
    try {
      // Search by exact email
      // Use runtime access to customer search; typings may not include it
      const found = await (stripe as unknown as { customers: { search: (args: { query: string; limit?: number }) => Promise<{ data: Stripe.Customer[] }> } }).customers.search({ query: `email:'${email}'`, limit: 1 });
      if (found?.data?.length) customer = found.data[0] as Stripe.Customer;
    } catch {
      const list = await stripe.customers.list({ email, limit: 1 });
      if (list.data && list.data.length) customer = list.data[0] as unknown as Stripe.Customer;
    }
  } catch {}
  let subscription: Stripe.Subscription | null = null;
  if (!customer) {
    // Fallback A: scan recent checkout sessions by email
    try {
      const since = Math.floor(Date.now()/1000) - 60 * 60 * 24 * 14; // last 14 days
      const sessions = await (stripe as unknown as { checkout: { sessions: { list: (args: { created?: { gte?: number }, limit?: number }) => Promise<{ data: Array<{ customer?: string|null, customer_details?: { email?: string|null }, subscription?: string|null }> }> } } }).checkout.sessions.list({ created: { gte: since }, limit: 100 });
      for (const s of (sessions?.data || [])) {
        const sessEmail = (s.customer_details?.email || '').toLowerCase();
        if (sessEmail && sessEmail === email.toLowerCase()) {
          const custId = s.customer as string | undefined;
          if (custId) {
            try { customer = await stripe.customers.retrieve(custId) as unknown as Stripe.Customer; } catch {}
          }
          // Note: subscription retrieval handled below
          if (customer) break;
        }
      }
    } catch {}
  }
  if (!customer) {
    // Fallback B: scan recent checkout.session.completed events for this email
    try {
      const since = Math.floor(Date.now()/1000) - 60 * 60 * 24 * 14; // last 14d
      const evs = await stripe.events.list({
        types: ['checkout.session.completed'],
        limit: 20,
        created: { gte: since },
      } as unknown as Stripe.EventListParams);
      for (const ev of (evs?.data || [])) {
        const obj = (ev.data?.object as unknown as { customer_details?: { email?: string }, customer_email?: string, customer?: string }) || {};
        const sessEmail: string = obj?.customer_details?.email || obj?.customer_email || '';
        if (sessEmail && email && sessEmail.toLowerCase() === email.toLowerCase()) {
          const custId = obj.customer as string;
          if (custId) {
            try { customer = await stripe.customers.retrieve(custId) as unknown as Stripe.Customer; } catch {}
            break;
          }
        }
      }
    } catch {}
    if (!customer) return new NextResponse('No Stripe customer found', { status: 404 });
  }

  // Grab latest active/trialing subscription
  try {
    if (!subscription) {
      // If we saw a session subscription above, try to grab it again from recent sessions
      try {
        const since = Math.floor(Date.now()/1000) - 60 * 60 * 24 * 14;
        const sessions2 = await (stripe as unknown as { checkout: { sessions: { list: (args: { customer?: string, created?: { gte?: number }, limit?: number }) => Promise<{ data: Array<{ subscription?: string|null }> }> } } }).checkout.sessions.list({ customer: customer.id, created: { gte: since }, limit: 10 });
        for (const s2 of (sessions2?.data || [])) {
          if (s2.subscription) { try { subscription = await stripe.subscriptions.retrieve(String(s2.subscription)) as unknown as Stripe.Subscription; } catch {} }
          if (subscription) break;
        }
      } catch {}
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10 });
      subscription = subs.data?.find(s => (s.status === 'active' || s.status === 'trialing')) as unknown as Stripe.Subscription || subs.data?.[0] as unknown as Stripe.Subscription || null;
    }
  } catch {}
  if (!subscription) return new NextResponse('No subscription for customer', { status: 404 });

  // Persist mapping/entitlements
  const supa = getSupabaseAdmin();
  await supa.from('stripe_customers').upsert({ uid, stripe_customer_id: String(customer.id) });
  const price = (subscription.items.data?.[0]?.price as Stripe.Price | undefined) || undefined;
  const priceId = price?.id || '';
  const currentEnd = ((subscription as unknown) as { current_period_end?: number })?.current_period_end;
  await supa.from('subscriptions').upsert({
    uid,
    stripe_subscription_id: String(subscription.id),
    plan_id: priceId || 'unknown',
    status: String(subscription.status),
    current_period_end: currentEnd ? new Date(currentEnd * 1000).toISOString() : null,
  }, { onConflict: 'stripe_subscription_id' });

  return NextResponse.json({ ok: true, linked: true });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
