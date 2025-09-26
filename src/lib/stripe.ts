import Stripe from 'stripe';
import { getEnv } from './env';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const env = getEnv();
  _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return _stripe;
}
