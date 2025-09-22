Reviews & Marketing
===================

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 app to collect/share Google reviews, generate QR codes, and manage Pro billing.

Quick Start
-----------

- Prereqs: Node 20, npm
- Copy `.env.example` → `.env.local` and fill required vars
- Install deps: `npm ci`
- Run dev: `npm run dev` → http://localhost:3000

Required Env (server)
---------------------

Validated in `src/lib/env.ts`:

- `APP_URL` — e.g. http://localhost:3000
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, optional `STRIPE_YEARLY_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `POSTMARK_SERVER_TOKEN`, `EMAIL_FROM`
- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_B64` (base64 of service account JSON)

Optional env:

- `NEXT_PUBLIC_FIREBASE_*` client config
- `NEXT_PUBLIC_ADMIN_EMAILS`
- `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `ADMIN_TOKEN`, `MIGRATIONS_ONCE_TOKEN`, `SUPABASE_DB_PASSWORD`

Key App Flows
-------------

- Auth: Firebase client; server session via `/api/auth/session` (HttpOnly cookie)
- Billing: `/api/stripe/checkout` (monthly|yearly), webhook `/api/webhooks/stripe`
- Entitlements: `src/lib/entitlements.ts` + `/api/plan/status`
- Places: `/api/places/autocomplete`, `/api/places/details` (v1 + legacy fallback)
- Onboarding: `src/app/(app)/onboarding/business/page.tsx`
- Dashboard (Pro only): `src/app/(app)/dashboard/*`

Deployments
-----------

### Production (Vercel)

Project path: `/Users/mike/Documents/reviewsandmarketing`

All commands assume Node 20 (use `nvm use 20.19.4` or prefix with `PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH`). Steps for a fresh machine:

1. `cd /Users/mike/Documents/reviewsandmarketing`
2. `vercel login` (once per operator)
3. `vercel link --project reviewsandmarketing`
4. `bash scripts/vercel_setup.sh`
   - Reads `.env.local`, forces `APP_URL=https://reviewsandmarketing.com`
   - Pushes every env var to Vercel prod
   - Runs `vercel deploy --prod`
   - Re-attaches `reviewsandmarketing.com` + `www.reviewsandmarketing.com`
   - Prints DNS instructions (`ns1.vercel-dns.com`, `ns2.vercel-dns.com` or A `76.76.21.21` / CNAME `cname.vercel-dns.com`)
5. Health check: `curl -s https://reviewsandmarketing.com/api/healthz | jq`
6. Optional smoke: `PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH npm run test:smoke`

If the cloud build fails, inspect logs via `vercel inspect <deployment-url> --logs` (URL printed by the script) and re-run once resolved.

Manual/prebuilt alternative:

1. `npm run build`
2. `npx vercel build --prod`
3. `vercel deploy --prebuilt --prod`

Stripe/Postmark reminders:

- Stripe webhook must point to `https://reviewsandmarketing.com/api/webhooks/stripe`.
- Rotate `STRIPE_WEBHOOK_SECRET` in Vercel if you update Stripe.
- Postmark DNS records are already staged in Vercel; only update when changing DKIM/Return-Path.

### Alternate (legacy) Elastic Beanstalk

1. `scripts/pack_eb_bundle.sh`
2. `scripts/deploy_eb.sh <env-name>` (requires AWS CLI + env vars configured in EB)

After EB deploy, ensure DNS (Route 53) and SSL (ACM) still point to the environment.

Testing & Health
----------------

- Health: `GET /api/health` and `GET /api/healthz`
- Smoke test (optional): `APP_URL=https://your-host node scripts/smoke_puppeteer.mjs`

Where to Change Things
----------------------

- Pricing copy: `src/app/(mkt)/pricing/page.tsx`
- Header CTA: `src/components/SiteHeader.tsx`
- Entitlements: `src/lib/entitlements.ts`, `src/app/api/plan/status/route.ts`
- Places tuning: `src/lib/googlePlaces.ts`, `src/app/api/places/*`

More docs
---------

See `docs/DEPLOYMENT.md` for full architecture, hosting, environment, and runbooks (Vercel + EB).
