import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isInternalTestProEmail } from '@/lib/internalTestAccounts';
import { effectiveReplyFromUserRow } from '@/lib/replyToEmail';

export interface PlanInfo {
  isPro: boolean;
  planStatus: string;
  ownerEmail: string | null;
  subscriptionData: { status: string; plan_id: string | null } | null;
}

export async function resolvePlan(uid: string): Promise<PlanInfo> {
  const supa = getSupabaseAdmin();
  let isPro = false;
  let planStatus = 'none';
  let subscriptionData: { status: string; plan_id: string | null } | null = null;
  let ownerEmail: string | null = null;

  const { data: userRow } = await supa
    .from('users')
    .select('email, reply_to_email')
    .eq('uid', uid)
    .maybeSingle();
  const accountEmail = userRow?.email || null;
  ownerEmail = effectiveReplyFromUserRow(userRow);
  if (isInternalTestProEmail(accountEmail)) {
    return {
      isPro: true,
      planStatus: 'active',
      ownerEmail,
      subscriptionData: { status: 'active', plan_id: 'internal_pro' },
    };
  }

  const { data: subscription } = await supa
    .from('subscriptions')
    .select('status, plan_id')
    .eq('uid', uid)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  subscriptionData = subscription;

  if (subscription) {
    planStatus = subscription.status.toLowerCase();
    const planId = subscription.plan_id?.toLowerCase() || '';
    if ((planStatus === 'active' || planStatus === 'trialing') && planId !== 'free' && planId !== 'starter') {
      isPro = true;
    }
  }

  return { isPro, planStatus, ownerEmail, subscriptionData };
}

export function resolvePlanUsage(subscriptionData: { status: string; plan_id: string | null } | null, planStatus: string) {
  let requestsLimit = 3;
  let planName = 'Starter';

  if (planStatus === 'active' || planStatus === 'trialing') {
    const planId = (subscriptionData?.plan_id || '').toLowerCase();
    if (planId === 'starter' || planId === 'free') {
      requestsLimit = 3;
      planName = 'Starter';
    } else if (planId.includes('mid') || planId.includes('growth') || planId.includes('small')) {
      requestsLimit = 100;
      planName = 'Small Business';
    } else {
      requestsLimit = 999999;
      planName = 'Unlimited';
    }
  }

  return { requestsLimit, planName };
}
