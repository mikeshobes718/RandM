Deployment & Operations
=======================

Overview
--------

- Product: Reviews & Marketing — collect/share Google reviews, generate QR codes, basic+advanced analytics, Pro plan gating, team features (scaffolded).
- Stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4, Node 20 runtime.
- Hosting (Production): Vercel (Edge + Node runtime). Domain/TLS: Vercel DNS (ns1/ns2.vercel-dns.com) or A/CNAME pointing to Vercel.
- Hosting (Alternate): AWS Elastic Beanstalk (AL2023, Node 20). Domain/TLS via Route 53 + ACM.
- Services: Firebase Auth (client) + Firebase Admin (server); Postgres via Supabase; Stripe for billing; Postmark for email; Google Places (New v1 with legacy fallback).
- Repo: Componentized App Router structure; server “API routes” under `src/app/api/*`; deploy scripts under `scripts/*`; DB SQL under `db/*`.

Runtime & Environments
----------------------

- Entry: Next.js in standalone mode (`.next/standalone/server.js`) for EB; Vercel uses the built output directly.
- Required env (validated in `src/lib/env.ts`):
  - `APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, optional `STRIPE_YEARLY_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
  - `POSTMARK_SERVER_TOKEN`, `EMAIL_FROM`
  - `GOOGLE_MAPS_API_KEY`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `FIREBASE_SERVICE_ACCOUNT_B64` (base64 of service account JSON)
- Optional env:
  - `NEXT_PUBLIC_*` Firebase web config; `NEXT_PUBLIC_ADMIN_EMAILS` (comma‑separated);
  - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; `RECAPTCHA_SECRET_KEY`; `ADMIN_TOKEN`.
- Vercel: Configure env variables in Project → Settings → Environment Variables. `scripts/vercel_setup.sh` can import from `.env.local` and force `APP_URL=https://<your-domain>`.
- EB: Configure as environment variables in the EB environment (use live Stripe keys in production).

Auth Flow
---------

- Client registers/signs in via Firebase SDK. After auth, the client POSTs `/api/auth/session` with `idToken` to set a secure HttpOnly session cookie (idToken) used by the server.
- Server verifies cookie via `verifySessionCookie` with fallback to `verifyIdToken` (see `src/lib/authServer.ts: requireUid()`).
- Session Sync: `src/components/ClientAuthSync.tsx` keeps the server cookie fresh and emits `idtoken:changed`.
- Email verification:
  - Branded emails via Postmark: `/api/auth/email` uses Firebase Admin `generateEmailVerificationLink`. `src/app/(auth)/verify-email/page.tsx` handles resend, checks verification, and routes to `/pricing?welcome=1`.

Gating
------

- Pro-only pages (Dashboard) enforce entitlements (`src/app/(app)/dashboard/layout.tsx`).
- Header shows Signed in, Logout, and CTAs based on entitlements.

Billing & Entitlements
----------------------

- Checkout: `POST /api/stripe/checkout` (server prefers cookie auth; otherwise accepts anon `email`). Uses `STRIPE_PRICE_ID` or `STRIPE_YEARLY_PRICE_ID` (`plan` passed as `monthly|yearly`). Metadata: `uid`, `plan`.
- Webhook: `POST /api/webhooks/stripe` mirrors `checkout.session.completed` and `customer.subscription.*` into Supabase (`stripe_customers`, `subscriptions`), sets `status` and `current_period_end`.
- Entitlements: `src/lib/entitlements.ts`: `hasActivePro(uid)` returns true when Subscriptions table has `active|trialing`. Used by gating and UI.
- Header CTA respects saved billing preference (`localStorage.billingPreference`) and opens Stripe Checkout directly when user already has a plan record; otherwise links to `/pricing`. See `src/components/SiteHeader.tsx`.
- Pricing UI (`src/app/(mkt)/pricing/page.tsx`): toggles Monthly/Yearly; persists `billingPreference`; displays `$49.99/mo` or `$499/yr` with “≈ $41.58/mo when billed yearly”. Starter plan uses “Get Started Free”.

Data & Schema
-------------

Tables: `users(uid,email,created_at)`, `businesses(id,owner_uid,name,google_place_id,google_rating,review_link,created_at,updated_at,google_maps_place_uri,google_maps_write_review_uri)`, `customers`, `review_requests`, `short_links`, `short_clicks`, `place_cache` (also used as a simple KV), `stripe_customers`, `subscriptions`, `email_log`, `webhook_events`.

Team scaffolding: `business_members`, `member_invites` (see `db/004_business_members.sql`, `db/005_member_invites.sql`).

Key App Flows
-------------

Onboarding “Connect your business” (`src/app/(app)/onboarding/business/page.tsx`):
- Debounced search + keyboard nav (↑/↓/Enter/Esc); persists last query; region dropdown with “United States” pinned and “All countries”; optional “Use my location”.
- Autocomplete: `POST /api/places/autocomplete` with input, sessionToken, language, optional `lat/lng`, optional `includedRegionCodes`. Server auto-detects country via headers (CloudFront/Cloudflare/Vercel), caches a `region_hint` cookie (30m), and reuses it.
- Details: `GET /api/places/details?placeId=...&sessionToken=...` returns name, address, rating/counts, URLs, `writeAReviewUri`, coordinates.
- Map: server-proxied Static Map `/api/maps/static?lat=&lng=&w=&h=&zoom=`, with embed fallback.
- Review link: rendered/copyable; `writeAReviewUri` computed via v1 fallback when missing.
- QR preview: Pro shown immediately; Starter hidden until “Save and continue” (avoid Starter QR 403).
- Save business: `POST /api/businesses/upsert` uses cookie (`requireUid()`), falls back to Bearer; success toast + redirect to `/dashboard`.
- Back to search: clears selection, resets session token, refocuses, repopulates suggestions.

Dashboard (`src/app/(app)/dashboard/page.tsx`): Pro‑only; shows Today’s Revenue, New Businesses, Clicks Today, Active Subscribers, MRR (`/api/analytics/*`), saved business, review link, QR image, performance chart.

Pricing (`src/app/(mkt)/pricing/page.tsx`): “Get Started Free” (onboarding) and “Upgrade to Pro (Monthly|Yearly)” (Stripe). Copy mentions free Starter plan and yearly savings.

Contact (`src/app/(mkt)/contact/page.tsx`): `POST /api/contact` uses Postmark to email support and the submitter. Optional reCAPTCHA v3.

API Endpoints (server routes)
----------------------------

Auth:
- `POST /api/auth/session` → sets HttpOnly cookie from Firebase idToken.
- `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/email`.

Stripe:
- `POST /api/stripe/checkout` (monthly/yearly; uses session cookie if available).
- `POST /api/webhooks/stripe` (mirror + idempotent via `webhook_events`).

Places:
- `POST /api/places/autocomplete` (v1 API with graceful legacy fallback; IP country detect; region hint cookie).
- `GET /api/places/details` (v1/legacy, returns location & review links).
- `GET /api/maps/static` (server-proxy to Static Maps; falls back to a small SVG if Static Maps restricted).

Business:
- `GET /api/businesses/me` (accepts cookie or Bearer).
- `POST /api/businesses/upsert` (accepts cookie or Bearer).

QR:
- `GET /api/qr` outputs PNG/SVG; Starter limit: only allowed for saved `review_link` of the user’s business; otherwise 403; Pro bypasses restriction.

Analytics:
- `GET /api/analytics/summary`, `GET /api/analytics/links/timeseries`, `GET /api/analytics/subscribers`.

Members (scaffolded): `GET /api/members/list`, `POST /api/members/invite`, `POST /api/members/accept`, `POST /api/members/remove`.

Plan: `GET /api/plan/status` returns last known status or `none`.

Admin: `GET /api/admin/plan?email=...` guarded by `x-admin-token`; Admin UI client-gated by `NEXT_PUBLIC_ADMIN_EMAILS`.

Health: `GET /api/health` and `GET /api/healthz` both return `{status:'ok'}` payload.

Libraries & Utilities
---------------------

- Stripe: `src/lib/stripe.ts` (client); `src/lib/entitlements.ts` (hasActivePro + compute MRR).
- Firebase server/admin: `src/lib/firebaseAdmin.ts`, client: `src/lib/firebaseClient.ts`.
- Supabase: `src/lib/supabaseAdmin.ts`.
- Environment validator: `src/lib/env.ts`.
- Google Places: `src/lib/googlePlaces.ts` (v1 + legacy fallback; details include coordinates).
- Email templates: `src/lib/emailTemplates.ts`.
- Auth helpers: `src/lib/authServer.ts`.

UI Components
-------------

- `src/components/SiteHeader.tsx`: Header states (Signed in as …, Logout, Pro badge), CTAs — respects `billingPreference`.
- `src/components/SiteFooter.tsx`: Informational links.
- `src/components/ClientAuthSync.tsx`: Maintains session cookie and emits client events.

Deployment (Vercel)
-------------------

Project root: `/Users/mike/Documents/reviewsandmarketing`. Use Node 20 for CLI work (e.g., `nvm use 20.19.4` or prefix commands with `PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH`).

### Standard production deploy

1. `cd /Users/mike/Documents/reviewsandmarketing`
2. `vercel login` (once per machine)
3. `vercel link --project reviewsandmarketing`
4. `bash scripts/vercel_setup.sh`
   - Imports `.env.local`, forces `APP_URL=https://reviewsandmarketing.com`
   - Pushes env vars, runs `vercel deploy --prod`, re-attaches domains, and prints DNS guidance (`ns1.vercel-dns.com` / `ns2.vercel-dns.com` or A `76.76.21.21` + CNAME `cname.vercel-dns.com`)
5. Verify health: `curl -s https://reviewsandmarketing.com/api/healthz | jq`
6. Optional smoke: `PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH npm run test:smoke`

If the build fails, inspect with `vercel inspect <deployment-url> --logs` (URL printed by the script) then redeploy.

### Manual / prebuilt alternative

```
PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH npm run build
PATH=$HOME/.nvm/versions/node/v20.19.4/bin:$PATH npx vercel build --prod
vercel deploy --prebuilt --prod
```

### Integrations & DNS

- Stripe webhook → `https://reviewsandmarketing.com/api/webhooks/stripe` (update `STRIPE_WEBHOOK_SECRET` in Vercel if rotated).
- Postmark DKIM/SPF/Return-Path records live in Vercel DNS; update via `scripts/vercel_dns_postmark.sh` or Postmark UI if keys change.

Deployment (EB — alternate)
---------------------------

- Build: `scripts/pack_eb_bundle.sh` (Next.js standalone + zip)
- Deploy: `scripts/deploy_eb.sh <env-name>` (uploads to S3, creates EB version, updates env)
- Domain: Route 53 points to EB CNAME; TLS via ACM.
- Post‑deploy: ensure EB env variables match; Stripe webhook configured; Google APIs enabled; Supabase reachable.

Local Development
-----------------

- Prereqs: Node 20 + npm.
- `.env.local`: fill all required server-side env keys (can use test keys locally).
- Launch: `npm run dev` → http://localhost:3000
- Smoke test against prod: `APP_URL=https://reviewsandmarketing.com node scripts/smoke_puppeteer.mjs`.

Where to Change Things
----------------------

- Pricing copy/FAQ: `src/app/(mkt)/pricing/page.tsx`
- Header CTA behavior: `src/components/SiteHeader.tsx`
- Entitlements logic: `src/lib/entitlements.ts`, `src/app/api/plan/status/route.ts`
- Dashboard gating: `src/app/(app)/dashboard/layout.tsx`
- Stripe SKUs: set `STRIPE_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID`
- Contact e‑mail copy: `src/app/api/contact/route.ts`
- Places tuning (autocomplete/details): `src/lib/googlePlaces.ts`, server handlers under `src/app/api/places/*`

Recent Enhancements (Important)
-------------------------------

- Hosting: Production deployed on Vercel; domain attached; TLS auto‑provisioned.
- Health: Added `/api/healthz` for ELB/monitor compatibility alongside `/api/health`.
- Build: Added `styled-jsx` to satisfy Next 15 require‑hook; ensured standalone copy of static assets for EB bundle.
- Ops scripts: `scripts/vercel_setup.sh`, `scripts/vercel_dns_postmark.sh`, `scripts/watch_dns_and_smoke.sh`.
- Security: API endpoints prefer HttpOnly cookie; Starter QR restriction enforced server‑side.

Common Pitfalls & Notes
-----------------------

- If Google Places v1 (New) isn’t enabled, autocomplete/details fall back; map embed fallback ensures a visible map even if Static Maps disabled.
- Starter QR route returns 403 unless the QR data matches the saved `review_link` for that user; Starter users see QR after “Save”.
- Stripe webhooks must be configured for live mode; otherwise entitlements won’t update post‑checkout.
- Safari can show stale header on refresh; `ClientAuthSync` corrects it on the next tick.
- If AWS account is suspended/closed, EB and Route 53 DNS won’t work; use Vercel + Vercel DNS.

Code Map (quick links)
----------------------

- App pages: `src/app/(mkt)/*`, `src/app/(auth)/*`, `src/app/(app)/*`
- API routes: `src/app/api/*`
- Libraries: `src/lib/*`
- UI components: `src/components/*`
- DB SQL: `db/*.sql`
- Deployment: `scripts/pack_eb_bundle.sh`, `scripts/deploy_eb.sh`, `scripts/vercel_setup.sh`
- Middleware (if present for soft gating): `middleware.ts`

Runbooks
--------

- Update pricing text: edit `src/app/(mkt)/pricing/page.tsx`, deploy via Vercel.
- Attach domain on Vercel: `vercel domains add reviewsandmarketing.com` → change nameservers at registrar → verify health.
- Set envs on Vercel: `bash scripts/vercel_setup.sh` (imports from `.env.local`).
- Stripe webhook update: set endpoint to apex and update `STRIPE_WEBHOOK_SECRET` in Vercel.
- Investigate “Unauthorized” on save:
  - Ensure the HttpOnly cookie `idToken` is set (via `/api/auth/session`).
  - `/api/businesses/upsert` accepts cookie or Bearer; verify Firebase service account env present and `APP_URL` correctness.
- Health checks: `/api/health` and `/api/healthz`.
- Smoke test: `node scripts/smoke_puppeteer.mjs` (set `APP_URL`).

Email Deliverability Verification
---------------------------------

1. Prepare a test mailbox (e.g., `test+signup@yourdomain.com`) that you can access.
2. Go to `/register`, create a new account with that email, and complete the form.
3. Confirm that Postmark recorded the verification email: Dashboard → Activity → filter by the test address. You should see template `verify` with status “Sent”.
4. In Supabase, run `select * from email_log where to_email = '<test email>' order by created_at desc limit 5;` to verify the `provider_message_id` and `template='verify'` entry were written.
5. Trigger a password reset via `/forgot` using the same address.
6. Check Postmark for a second message with template `reset` and status “Sent”; Supabase’s `email_log` should have a matching `reset` row.
7. If Postmark is unreachable, the client falls back to Firebase’s `sendPasswordResetEmail`; you can simulate this by temporarily blocking outbound requests to Postmark and confirming the Firebase email arrives (the Supabase log will still record the Postmark failure).
8. After testing, delete the throwaway user from Firebase Auth and clean up the Supabase `users`, `businesses`, and `subscriptions` rows if needed.
