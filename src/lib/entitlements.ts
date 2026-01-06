import { getSupabaseAdmin } from './supabaseAdmin';
import { getEnv } from './env';
import { getStripeClient } from './stripe';

import { PLANS, getPlanFromId } from './plans';

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
    
    if (data) {
      const planTier = getPlanFromId(data.plan_id as string | null | undefined);
      return planTier === 'mid' || planTier === 'pro';
    }
  } catch {}

  return false;
}

export async function getPlanLimits(uid: string) {
  const supa = getSupabaseAdmin();

  const { data: sub } = await supa
    .from('subscriptions')
    .select('status, plan_id')
    .eq('uid', uid)
    .in('status', ['active', 'trialing', 'starter'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const tier = getPlanFromId(sub?.plan_id || (sub?.status === 'starter' ? 'starter' : null));
  return PLANS[tier];
}

export async function checkPlanLimit(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supa = getSupabaseAdmin();
  
  // Get business owner
  const { data: biz } = await supa.from('businesses').select('owner_uid').eq('id', businessId).maybeSingle();
  if (!biz) return { allowed: true }; // Should not happen

  const limits = await getPlanLimits(biz.owner_uid);
  if (limits.id === 'pro') return { allowed: true };

  // Count reviews this month
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count } = await supa
    .from('review_events')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('event', ['google_opened', 'feedback_submitted'])
    .gte('created_at', startOfMonth.toISOString());

  if ((count || 0) >= limits.reviewLimit) {
    return { 
      allowed: false, 
      reason: `Monthly limit of ${limits.reviewLimit} reviews reached for the ${limits.name} plan. Upgrade to continue collecting feedback.` 
    };
  }

  return { allowed: true };
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
