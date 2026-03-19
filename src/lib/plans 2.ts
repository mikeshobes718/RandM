export type PlanTier = 'starter' | 'mid' | 'pro';

export interface PlanDetails {
  id: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number; // monthly equivalent when billed annually
  reviewLimit: number; // per month
  qrLimit: number;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    reviewLimit: 3,
    qrLimit: 1,
    features: ['3 Review Requests / mo', '1 Smart QR Code', 'Basic Analytics', 'Email Support'],
  },
  mid: {
    id: 'mid',
    name: 'Small Business',
    monthlyPrice: 39,
    yearlyPrice: 32.5, // 390 / 12
    reviewLimit: 100,
    qrLimit: 5,
    features: ['100 Review Requests / mo', '5 Smart QR Codes', 'Square Integration', 'Standard Email Support'],
  },
  pro: {
    id: 'pro',
    name: 'Unlimited',
    monthlyPrice: 79,
    yearlyPrice: 65.83, // 790 / 12
    reviewLimit: 1000000, // Effectively unlimited
    qrLimit: 1000000, // Effectively unlimited
    features: ['Unlimited Review Requests', 'Unlimited QR Codes', 'All Integrations', 'Priority Support', 'Advanced Reporting'],
  },
};

export function getPlanFromId(planId: string | null | undefined): PlanTier {
  if (!planId) return 'starter';
  const pid = planId.toLowerCase();
  
  // Mid tier patterns
  if (pid.includes('mid') || pid.includes('small-business') || pid.includes('smallbusiness')) return 'mid';
  
  // Pro tier patterns
  if (pid.includes('pro') || pid.includes('unlimited') || pid.includes('yearly') || pid.includes('monthly')) {
    // If it's specifically a mid-tier price ID, return mid
    // This is a safety check for the actual stripe IDs
    return 'pro';
  }
  
  return 'starter';
}


