import { z } from 'zod';

const ServerEnvSchema = z.object({
  APP_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_PRICE_ID: z.string().min(1),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PORTAL_CONFIGURATION_ID: z.string().optional(),

  POSTMARK_SERVER_TOKEN: z.string().min(1),
  EMAIL_FROM: z.string().email(),

  GOOGLE_MAPS_API_KEY: z.string().min(1),

  SQUARE_APPLICATION_ID: z.string().min(1).optional(),
  SQUARE_APPLICATION_SECRET: z.string().min(1).optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Optional direct DB fallback (Supabase Postgres) when HTTP fetch fails
  SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  SUPABASE_DB_HOST: z.string().min(1).optional(),
  SUPABASE_DB_PORT: z.string().regex(/^\d+$/).optional(),
  SUPABASE_DB_USER: z.string().min(1).optional(),
  SUPABASE_DB_NAME: z.string().min(1).optional(),

  // Allow this to be truly optional even if an empty string is present in the environment
  FIREBASE_SERVICE_ACCOUNT_B64: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(1).optional()
  ),
  
  // Individual Firebase environment variables (for production)
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_PRIVATE_KEY_ID: z.string().min(1).optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_CLIENT_ID: z.string().min(1).optional(),
  FIREBASE_AUTH_URI: z.string().url().optional(),
  FIREBASE_TOKEN_URI: z.string().url().optional(),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string().url().optional(),
  FIREBASE_CLIENT_X509_CERT_URL: z.string().url().optional(),
  FIREBASE_UNIVERSE_DOMAIN: z.string().min(1).optional(),
});

type ServerEnv = z.infer<typeof ServerEnvSchema>;

let _env: ServerEnv | null = null;

/** Validate and cache env at runtime when first used (not at import). */
export function getEnv(): ServerEnv {
  if (_env) return _env;
  const parsed = ServerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Missing/invalid server env: ${issues}`);
  }
  _env = parsed.data;
  return _env;
}

/** Convenience for public client config (no validation; optional at build). */
export const PUBLIC_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};
