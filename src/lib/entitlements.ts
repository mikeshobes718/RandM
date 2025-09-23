import { getSupabaseAdmin } from './supabaseAdmin';
import { getEnv } from './env';
import { getStripeClient } from './stripe';

function isProPlanId(planId: string | null | undefined): boolean {
  if (!planId) return false;
  const normalized = planId.trim().toLowerCase();
  if (!normalized || normalized === 'starter' || normalized.startsWith('starter-')) return false;
  return true;
}

export async function hasActivePro(uid: string): Promise<boolean> {
  try {
    const supa = getSupabaseAdmin();
    const { data } = await supa
      .from('subscriptions')
      .select('status, plan_id')
      .eq('uid', uid)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data && isProPlanId(data.plan_id as string | null | undefined)) {
      return true;
    }
  } catch {}

  return false;
}

export async function getActiveSubscribersAndMRR(): Promise<{ active: number; mrrUSD: number }> {
  const stripe = getStripeClient();
  const { STRIPE_PRICE_ID, STRIPE_YEARLY_PRICE_ID } = getEnv();
  const priceMonthly = STRIPE_PRICE_ID;
  const priceYearly = STRIPE_YEARLY_PRICE_ID;
  let active = 0;
  let mrrUSD = 0;
  // Iterate first page (100) which is sufficient for now
  const subs = await stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.items.price'] });
  for (const s of subs.data) {
    for (const it of s.items.data) {
      const priceId = typeof it.price === 'string' ? it.price : it.price.id;
      const amount = (typeof it.price === 'string' ? 0 : (it.price.unit_amount || 0)) / 100;
      const qty = it.quantity || 1;
      if (priceId === priceMonthly) {
        active += 1;
        mrrUSD += amount * qty;
      } else if (priceYearly && priceId === priceYearly) {
        active += 1;
        mrrUSD += (amount * qty) / 12; // convert annual to monthly equivalent
      }
    }
  }
  return { active, mrrUSD: Math.round(mrrUSD * 100) / 100 };
}
