# Engineer Handoff Document
## Reviews & Marketing - Complete Technical Reference

**Last Updated**: January 8, 2025  
**Project Owner**: Mike Shobes (mikeshobes718@yahoo.com)  
**Repository**: https://github.com/mikeshobes718/RandM  
**Live Site**: https://reviewsandmarketing.com  
**GitHub Commit**: `80de0fc` - Plan selection flow implementation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Local Development Setup](#local-development-setup)
5. [Deployment](#deployment)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [Key Features & Flows](#key-features--flows)
9. [API Endpoints](#api-endpoints)
10. [Email System](#email-system)
11. [Billing & Subscriptions](#billing--subscriptions)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Product**: Reviews & Marketing — Collect and share Google reviews, generate QR codes, analytics, Pro plan gating, team features.

**Core Value Propositions**:
- Collect 5-star Google reviews from customers
- Generate branded QR codes for review links
- Basic + advanced analytics
- Two-tier pricing (Starter free, Pro $29/month)
- Team collaboration features

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### Backend
- **Next.js API Routes** (serverless functions)
- **Node.js 20 runtime**

### Authentication
- **Firebase Auth** (client-side SDK)
- **Firebase Admin SDK** (server-side)

### Database
- **PostgreSQL** via Supabase

### Payments
- **Stripe** (Checkout + Customer Portal)

### Email
- **Postmark** (transactional emails)
- Custom branded HTML templates

### Maps & Places
- **Google Maps API**
- **Google Places API** (v1 with legacy fallback)

### Hosting & Deployment
- **Vercel** (serverless deployment)
- Custom domain with Vercel DNS

---

## Project Structure

```
/Users/mike/Documents/reviewsandmarketing/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (mkt)/             # Marketing pages (/, /pricing, /contact, etc.)
│   │   ├── (auth)/            # Auth pages (/login, /register, /forgot, etc.)
│   │   ├── (app)/             # App pages (/dashboard, /settings, etc.)
│   │   └── api/               # API routes (serverless functions)
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   │   ├── env.ts            # Environment variable validation (Zod)
│   │   ├── firebaseClient.ts # Firebase client SDK
│   │   ├── firebaseAdmin.ts  # Firebase Admin SDK
│   │   ├── supabaseAdmin.ts  # Supabase client
│   │   ├── stripe.ts         # Stripe client
│   │   ├── postmark.ts       # Postmark client
│   │   ├── emailTemplates.ts # Branded email templates
│   │   ├── entitlements.ts   # Pro plan checking
│   │   └── authServer.ts     # Server-side auth helpers
│   └── styles/               # Global styles
├── db/                        # SQL migration files
├── scripts/                   # Deployment & utility scripts
├── public/                    # Static assets
├── .env.local                # Local environment variables (DO NOT COMMIT)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vercel.json               # Vercel configuration
```

### Key Files

**Environment & Config**:
- `src/lib/env.ts` - Validates all required environment variables
- `.env.local` - Local development environment variables
- `vercel.json` - Vercel deployment configuration

**Authentication**:
- `src/lib/firebaseClient.ts` - Client-side Firebase Auth
- `src/lib/firebaseAdmin.ts` - Server-side Firebase Admin
- `src/lib/authServer.ts` - Session cookie verification
- `src/components/ClientAuthSync.tsx` - Keeps session cookie fresh

**Email**:
- `src/lib/emailTemplates.ts` - Branded HTML email templates
- `src/lib/postmark.ts` - Postmark email client
- `src/app/api/auth/email/route.ts` - Verification & reset email sender
- `src/app/api/auth/register/route.ts` - Server-side registration (prevents Firebase auto-emails)

**Billing**:
- `src/app/api/stripe/checkout/route.ts` - Create Stripe Checkout session
- `src/app/api/webhooks/stripe/route.ts` - Process Stripe webhooks
- `src/lib/entitlements.ts` - Check Pro plan access

**Database**:
- `db/000_init.sql` - Initial schema
- `db/001_*.sql` - Migration files (run in order)

---

## Local Development Setup

### Prerequisites
- **Node.js 20.x** (use nvm: `nvm use 20`)
- **npm** or **yarn**
- **Git**

### Setup Steps

1. **Clone the repository**:
```bash
git clone https://github.com/mikeshobes718/RandM.git
cd RandM
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create `.env.local`** (copy from `.env.example`):
```bash
# Firebase
FIREBASE_SERVICE_ACCOUNT_B64="<base64 encoded service account JSON>"
NEXT_PUBLIC_FIREBASE_API_KEY="<firebase-api-key>"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="<firebase-auth-domain>"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="<firebase-project-id>"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="<firebase-storage-bucket>"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="<firebase-messaging-sender-id>"
NEXT_PUBLIC_FIREBASE_APP_ID="<firebase-app-id>"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="<firebase-measurement-id>"

# App
APP_URL="http://localhost:3000"

# Supabase
SUPABASE_URL="<supabase-url>"
SUPABASE_SERVICE_ROLE_KEY="<supabase-service-role-key>"

# Stripe (use test keys locally)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID="<stripe-price-id>"
STRIPE_WEBHOOK_SECRET="whsec_..."

# Postmark
POSTMARK_SERVER_TOKEN="<postmark-server-token>"
EMAIL_FROM="subscriptions@reviewsandmarketing.com"

# Google Maps
GOOGLE_MAPS_API_KEY="<google-maps-api-key>"
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open browser**:
```
http://localhost:3000
```

### Database Setup

Run migrations:
```bash
# Connect to Supabase via psql
psql "<supabase-connection-string>"

# Then run each migration file
\i db/000_init.sql
\i db/001_stripe_customers.sql
# ... etc
```

Or use Supabase dashboard SQL editor.

---

## Deployment

### Vercel Setup

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Link project**:
```bash
cd /Users/mike/Documents/reviewsandmarketing
vercel link --project reviewsandmarketing
```

4. **Set environment variables** (first time):
```bash
bash scripts/vercel_setup.sh
```

This script:
- Imports all vars from `.env.local`
- Forces `APP_URL=https://reviewsandmarketing.com`
- Pushes to all Vercel environments (Production, Preview, Development)
- Deploys to production
- Configures custom domain

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Deploy with Pre-build

```bash
npm run build
vercel deploy --prebuilt --prod
```

### Domain Configuration

**Primary domain**: `reviewsandmarketing.com`  
**Aliases**: `www.reviewsandmarketing.com`

**DNS Settings** (Vercel DNS):
- Type: A, Name: @, Value: 76.76.21.21
- Type: CNAME, Name: www, Value: cname.vercel-dns.com

Or use Vercel nameservers:
- ns1.vercel-dns.com
- ns2.vercel-dns.com

### Health Check

After deployment:
```bash
curl https://reviewsandmarketing.com/api/health
# Should return: {"status":"ok"}
```

---

## Environment Variables

### Required Server-Side

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Production URL | `https://reviewsandmarketing.com` |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Base64 encoded service account JSON | `eyJ0eXBlI...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `STRIPE_SECRET_KEY` | Stripe secret key (live in prod) | `sk_live_...` |
| `STRIPE_PRICE_ID` | Stripe monthly price ID | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `POSTMARK_SERVER_TOKEN` | Postmark API token | `xxx-xxx-xxx` |
| `EMAIL_FROM` | Sender email address | `subscriptions@reviewsandmarketing.com` |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Places API key | `AIza...` |

### Optional Server-Side

| Variable | Description |
|----------|-------------|
| `STRIPE_YEARLY_PRICE_ID` | Stripe yearly price ID (if different) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (can be client-side) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin emails |
| `ADMIN_TOKEN` | Admin API authentication token |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret (for contact form) |

### Public Client-Side (NEXT_PUBLIC_*)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Admin emails (for UI gating) |

---

## Database

### Schema Overview

**Tables**:
- `users` - Firebase UID, email, created_at
- `businesses` - Business profiles linked to users
- `stripe_customers` - Maps Firebase UIDs to Stripe customer IDs
- `subscriptions` - Stripe subscription records
- `review_requests` - Review request tracking
- `short_links` - URL shortener for review links
- `short_clicks` - Click tracking
- `email_log` - Email delivery log (Postmark)
- `webhook_events` - Stripe webhook idempotency
- `business_members` - Team member associations
- `member_invites` - Pending team invitations
- `place_cache` - Google Places API response cache

### Key Relationships

```
users.uid (1) → (n) businesses.owner_uid
users.uid (1) → (1) stripe_customers.uid
stripe_customers.stripe_customer_id (1) → (n) subscriptions.stripe_customer_id
businesses.id (1) → (n) review_requests.business_id
businesses.id (1) → (n) short_links.business_id
```

### Common Queries

**Check if user has Pro plan**:
```sql
SELECT * FROM subscriptions s
JOIN stripe_customers sc ON s.stripe_customer_id = sc.stripe_customer_id
WHERE sc.uid = '<firebase-uid>'
  AND s.status IN ('active', 'trialing')
  AND s.current_period_end > NOW();
```

**Get user's businesses**:
```sql
SELECT * FROM businesses
WHERE owner_uid = '<firebase-uid>'
ORDER BY created_at DESC;
```

**Email delivery log**:
```sql
SELECT * FROM email_log
WHERE to_email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Key Features & Flows

### 1. User Registration

**File**: `src/app/(auth)/register/page.tsx`  
**API**: `src/app/api/auth/register/route.ts`

**Flow**:
1. User fills form with email, password, business name
2. Client calls `/api/auth/register` (server-side)
3. Server creates user via Firebase Admin (no auto-email)
4. Server generates email verification link
5. Server sends branded email via Postmark
6. Server returns custom token
7. Client signs in with custom token
8. Redirects to `/verify-email`

**Why server-side?** To prevent Firebase from sending default verification emails.

### 2. Email Verification

**File**: `src/app/(auth)/verify-email/page.tsx`  
**API**: `src/app/api/auth/email/route.ts` (for resends)

**Flow**:
1. User clicks verification link in email
2. Firebase handles verification via action code
3. Page checks if user is verified
4. If verified, checks if user has completed onboarding
5. If no business record exists, redirects to `/select-plan`
6. If business exists, redirects to `/dashboard`
7. If not verified, shows resend button

### 3. Plan Selection (New Flow)

**File**: `src/app/(auth)/select-plan/page.tsx`  
**API**: `src/app/api/auth/welcome-email/route.ts`

**Flow**:
1. User arrives after email verification (new users only)
2. Displays Starter (free) and Pro ($29/month) options
3. User selects plan:
   - **Starter**: Redirects to `/onboarding/business`
   - **Pro**: Redirects to Stripe checkout (future implementation)
4. Selected plan stored in `localStorage` as `selectedPlan`
5. Plan indicator shown on onboarding page
6. Welcome email sent after business setup completion

### 4. Password Reset

**File**: `src/app/(auth)/forgot/page.tsx`  
**API**: `src/app/api/auth/email/route.ts`

**Flow**:
1. User enters email
2. Client calls `/api/auth/email` with `type: 'reset'`
3. Server generates Firebase password reset link
4. Server sends branded email via Postmark
5. User clicks link, enters new password
6. Firebase handles password update

### 5. Stripe Checkout

**File**: `src/app/(mkt)/pricing/page.tsx`  
**API**: `src/app/api/stripe/checkout/route.ts`

**Flow**:
1. User clicks "Upgrade to Pro"
2. Client calls `/api/stripe/checkout` with plan (monthly/yearly)
3. Server creates Stripe Checkout session
4. Server returns session URL
5. Client redirects to Stripe
6. After payment, Stripe redirects to `/post-checkout`
7. Stripe webhook updates `subscriptions` table

### 6. Business Onboarding

**File**: `src/app/(app)/onboarding/business/page.tsx`  
**API**: `/api/places/autocomplete`, `/api/places/details`, `/api/businesses/upsert`, `/api/auth/welcome-email`

**Flow**:
1. User arrives from plan selection (with `selectedPlan` in localStorage)
2. Plan indicator displayed in header
3. User searches for business (Google Places autocomplete)
4. Selects result
5. Map preview loads (Static Maps API)
6. Review link displayed
7. QR code preview (Pro only, Starter hidden until save)
8. User clicks "Save and continue"
9. Server creates/updates `businesses` record
10. Server sends plan-specific welcome email via `/api/auth/welcome-email`
11. Clears `selectedPlan` from localStorage
12. Redirects to `/dashboard`

### 7. Dashboard

**File**: `src/app/(app)/dashboard/page.tsx`  
**Guard**: `src/app/(app)/dashboard/layout.tsx` (Pro only)

**Shows**:
- Today's revenue
- New businesses
- Clicks today
- Active subscribers
- MRR
- Business info
- Review link
- QR code
- Performance chart

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Server-side user registration |
| `/api/auth/session` | POST | Set session cookie from Firebase token |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/me` | GET | Get current user from session |
| `/api/auth/email` | POST | Send verification or reset email |
| `/api/auth/welcome-email` | POST | Send plan-specific welcome email |

### Stripe / Billing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/checkout` | POST | Create Checkout session |
| `/api/stripe/portal` | POST | Create Customer Portal session |
| `/api/webhooks/stripe` | POST | Process Stripe webhooks |
| `/api/plan/status` | GET | Get user's plan status |

### Businesses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/businesses/me` | GET | Get user's businesses |
| `/api/businesses/upsert` | POST | Create/update business |

### Places & Maps

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/places/autocomplete` | POST | Google Places autocomplete |
| `/api/places/details` | GET | Get place details |
| `/api/maps/static` | GET | Proxy to Static Maps API |

### QR Codes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/qr` | GET | Generate QR code (PNG/SVG) |

**Starter restriction**: Only allowed for saved business review links.

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/summary` | GET | Dashboard summary stats |
| `/api/analytics/links/timeseries` | GET | Link click timeseries |
| `/api/analytics/subscribers` | GET | Subscriber growth |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/plan` | GET | Lookup user plan by email |
| `/api/admin/users/list` | GET | List all users |
| `/api/admin/subscriptions/list` | GET | List all subscriptions |

**Auth**: Requires `x-admin-token` header or admin email check.

### Other

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/contact` | POST | Send contact form email |
| `/api/newsletter/subscribe` | POST | Newsletter signup |
| `/api/reviews/send` | POST | Send review request email |

---

## Email System

### Overview

- **Provider**: Postmark
- **Sender**: `subscriptions@reviewsandmarketing.com`
- **Templates**: `src/lib/emailTemplates.ts`

### Email Types

1. **Verification Email** (`verifyEmailTemplate`)
   - Subject: "Verify your email — Welcome to Reviews & Marketing!"
   - Includes: Benefits bullets, security note, CTA button

2. **Password Reset** (`resetEmailTemplate`)
   - Subject: "Reset your password — Reviews & Marketing"
   - Includes: Security note, primary CTA, secondary "Return to Login" link

3. **Review Request** (`reviewRequestEmail`)
   - For businesses to request reviews from customers

4. **Team Invite** (`inviteEmail`)
   - Invite team members to collaborate

5. **Welcome Emails** (`starterWelcomeEmailTemplate`, `proWelcomeEmailTemplate`)
   - Plan-specific onboarding emails for new users
   - Sent after business setup completion
   - Different content for Starter vs Pro plans

### Firebase Email Configuration

**Important**: Firebase Console email templates must be **cleared/empty** to prevent Firebase from sending default emails.

**Firebase Console → Authentication → Templates**:
- Email verification: All fields empty
- Password reset: All fields empty

**Firebase SMTP Settings**:
- Configured with Postmark SMTP (optional)
- Server: `smtp.postmarkapp.com`
- Port: `587`
- Credentials: Postmark Server API Token

### Testing Emails

```bash
# Test verification email
curl -X POST https://reviewsandmarketing.com/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"verify"}'

# Test password reset email
curl -X POST https://reviewsandmarketing.com/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"reset"}'
```

**Check Postmark Activity**:
- https://account.postmarkapp.com
- Message Streams → Outbound → Activity

### Plan Selection Flow

**New User Journey**:
1. Register → Email verification → Plan selection → Business setup → Dashboard
2. Plan selection page: `/select-plan`
3. Welcome emails sent after business setup completion
4. Plan stored in localStorage during onboarding process

**Plan-Specific Features**:
- **Starter**: Free plan, basic features, 5 review requests/month
- **Pro**: $29/month, unlimited features, advanced analytics
- Different welcome email templates for each plan
- Plan indicator shown during onboarding

---

## Billing & Subscriptions

### Plans

**Starter** (Free):
- 5 review requests/month
- Basic analytics
- 1 business
- No team members

**Pro** ($29/month):
- Unlimited review requests
- Advanced analytics
- Unlimited businesses
- Team collaboration

### Stripe Webhook Events

Handled in `/api/webhooks/stripe`:

- `checkout.session.completed` - New subscription
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Plan changed
- `customer.subscription.deleted` - Cancellation

**Idempotency**: Uses `webhook_events` table to prevent duplicate processing.

### Entitlement Checking

**Server-side**: `src/lib/entitlements.ts`
```typescript
import { hasActivePro } from '@/lib/entitlements';

const isPro = await hasActivePro(uid);
if (!isPro) {
  return new Response('Pro plan required', { status: 403 });
}
```

**Client-side**: Check via `/api/plan/status`

### Manual Plan Updates

**Promote user to Pro**:
```bash
cd /Users/mike/Documents/reviewsandmarketing
SUPABASE_URL="<supabase-url>" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
node scripts/promote_to_pro.mjs user@example.com
```

---

## Common Tasks

### Add New Environment Variable

1. Add to `.env.local` for local testing
2. Add to `src/lib/env.ts` schema (Zod validation)
3. Add to Vercel:
```bash
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development
```
4. Redeploy: `vercel --prod`

### Create New API Endpoint

1. Create file: `src/app/api/[name]/route.ts`
2. Export `POST`, `GET`, etc. functions
3. Add runtime config:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```
4. Use auth helper:
```typescript
import { requireUid } from '@/lib/authServer';
const uid = await requireUid(req);
```

### Add New Email Template

1. Add function to `src/lib/emailTemplates.ts`
2. Use `brandedHtml` helper
3. Return `{ subject, html, text }`
4. Send via Postmark in API route

### Update Plan Selection Flow

1. Modify `/select-plan` page for new plans
2. Update welcome email templates in `src/lib/emailTemplates.ts`
3. Update `/api/auth/welcome-email` endpoint
4. Test plan-specific email delivery

### Update Pricing

1. Create new price in Stripe Dashboard
2. Update `STRIPE_PRICE_ID` or `STRIPE_YEARLY_PRICE_ID` in Vercel
3. Update copy in `src/app/(mkt)/pricing/page.tsx`

### Run Database Migration

```bash
# Connect to Supabase
psql "<supabase-connection-string>"

# Run migration file
\i db/00X_migration_name.sql

# Or use Supabase SQL editor (recommended)
```

### Debug Deployment Issue

```bash
# View recent logs
vercel logs https://reviewsandmarketing.com --since 1h

# Inspect specific deployment
vercel inspect https://reviewsandmarketing-xxx.vercel.app --logs

# Check build logs
vercel logs https://reviewsandmarketing.com --since 1h --output raw | grep "Error"
```

### Force Rebuild

```bash
# Clear cache and rebuild
vercel --prod --force

# Or with local build
npm run build
vercel deploy --prebuilt --prod
```

---

## Troubleshooting

### Email Not Sending

**Check**:
1. Postmark Activity dashboard
2. `email_log` table in Supabase
3. Vercel function logs: `vercel logs --since 30m`
4. `EMAIL_FROM` env var (must be `subscriptions@reviewsandmarketing.com`)
5. Firebase templates are cleared (not sending duplicates)

### Firebase Auth Issues

**Check**:
1. `FIREBASE_SERVICE_ACCOUNT_B64` is correctly base64 encoded
2. Service account JSON is valid
3. Firebase project ID matches in all configs
4. Session cookie is being set (`/api/auth/session`)

### Stripe Webhook Not Working

**Check**:
1. Webhook endpoint: `https://reviewsandmarketing.com/api/webhooks/stripe`
2. `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Webhook signature validation passing
4. Check `webhook_events` table for processing

### Database Connection Issues

**Check**:
1. Connection string format (pooled vs direct)
2. Password is correct
3. Supabase project is active (not paused)
4. SSL mode is `require`

### Build Failures

**Common causes**:
1. TypeScript errors - run `npm run build` locally
2. Missing environment variables - check Vercel settings
3. Dependency issues - delete `node_modules`, `npm install` again
4. Next.js cache - `rm -rf .next`

### 502 Bad Gateway

**Check**:
1. API route runtime (`nodejs` vs `edge`)
2. Function timeout (max 10s on Vercel Hobby)
3. Uncaught errors in API routes
4. Missing `try/catch` blocks

---

## Additional Resources

### Documentation Files

- `VERCEL_DEPLOYMENT.md` - Detailed Vercel deployment guide
- `EMAIL_FIX_SUMMARY.md` - Email system troubleshooting
- `FIREBASE_CONSOLE_FIX_INSTRUCTIONS.md` - Firebase email configuration
- `TROUBLESHOOTING_FIREBASE_EMAILS.md` - Email debugging guide
- `LIVE_CHAT_INTEGRATION.md` - Crisp Chat widget setup
- `ONBOARDING_FIX_FINAL_OCT8.md` - Onboarding flow fixes
- `DEPLOYMENT_COMPLETE.md` - Latest deployment status

### External Documentation

- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs
- Stripe: https://stripe.com/docs
- Postmark: https://postmarkapp.com/developer
- Supabase: https://supabase.com/docs

### Support Contacts

**Founder**: mikeshobes718@yahoo.com  
**Support Email**: support@reviewsandmarketing.com

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Deploy to production
vercel --prod

# View logs
vercel logs https://reviewsandmarketing.com --since 30m

# Add environment variable
vercel env add VAR_NAME production

# Link to Vercel project
vercel link

# Check health
curl https://reviewsandmarketing.com/api/health

# Promote user to Pro
node scripts/promote_to_pro.mjs user@example.com
```

---

## Recent Updates (January 8, 2025)

### Plan Selection Flow Implementation
- **Commit**: `80de0fc` - "feat: Implement plan selection flow after email verification"
- **New Page**: `/select-plan` - Plan selection after email verification
- **New API**: `/api/auth/welcome-email` - Plan-specific welcome emails
- **Updated Flow**: Email verification → Plan selection → Business setup → Dashboard
- **Features**: Plan-specific welcome emails, plan indicators, localStorage integration

### Live Chat Integration
- **Crisp Chat**: Website ID `5a825f3d-0b3c-43ba-ab11-589af2fac7bb`
- **Component**: `src/components/CrispChat.tsx`
- **Integration**: Automatic chat widget on all pages

### Password Strength Meter
- **Component**: `src/components/PasswordStrengthMeter.tsx`
- **Integration**: Registration page with real-time validation
- **Features**: Visual strength indicator, minimum 8 characters

### Email System Improvements
- **Multi-provider**: Postmark primary, Resend fallback
- **Branded Templates**: Custom HTML templates for all emails
- **Server-side Registration**: Prevents Firebase auto-emails
- **Plan-specific Emails**: Different welcome emails for Starter vs Pro

### Onboarding Flow Fixes
- **Issue**: New users skipping Google Place ID setup
- **Solution**: Redirect logic based on business record existence
- **Files**: `verify-email/page.tsx`, `login/page.tsx`, `onboarding/business/page.tsx`

---

**End of Engineer Handoff Document**

This document contains everything needed to develop, deploy, and maintain the Reviews & Marketing application. Keep credentials secure and rotate keys periodically.

**IMPORTANT**: Always deploy to https://www.reviewsandmarketing.com - this is a real/live product serving real customers. Fix issues ASAP as we have real customers using this platform.

**GitHub Repository**: https://github.com/mikeshobes718/RandM  
**Latest Commit**: `80de0fc` - Plan selection flow implementation  
**Live Site**: https://reviewsandmarketing.com

**Crisp Chat Integration**:
```html
<script type="text/javascript">
window.$crisp=[];
window.CRISP_WEBSITE_ID="5a825f3d-0b3c-43ba-ab11-589af2fac7bb";
(function(){
  d=document;
  s=d.createElement("script");
  s.src="https://client.crisp.chat/l.js";
  s.async=1;
  d.getElementsByTagName("head")[0].appendChild(s);
})();
</script>
```
