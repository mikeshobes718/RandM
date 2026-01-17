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
- `FIREBASE_SERVICE_ACCOUNT_B64` (base64 of Firebase service account JSON - also used for Google Sheets API)
- `GOOGLE_SHEETS_ID` — The Google Sheet ID for logging sales calls (found in the sheet URL)

Optional env:

- `NEXT_PUBLIC_FIREBASE_*` client config
- `NEXT_PUBLIC_ADMIN_EMAILS`
- `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `ADMIN_TOKEN`, `MIGRATIONS_ONCE_TOKEN`, `SUPABASE_DB_PASSWORD`

---

Sales Portal & Admin Panel
--------------------------

### Overview

The app includes a **Sales Portal** (`/sales-portal`) for sales reps to find leads and log calls, and an **Admin Panel** (`/admin/*`) for managers to view metrics and manage the team.

### Google Sheets Integration

**All call logs are stored in a Google Sheet as the primary source of truth.**

**Setup:**
1. Create a Google Sheet and note the ID from the URL (the long string between `/d/` and `/edit`)
2. Share the sheet with the Firebase service account email (found in your Firebase service account JSON as `client_email`)
3. Enable the Google Sheets API in your Google Cloud Console
4. Set `GOOGLE_SHEETS_ID` in your environment variables

**Google Sheet Structure (17 Columns - A through Q):**

| Column | Header | Description |
|--------|--------|-------------|
| A | Date | MM/DD/YYYY format (EST) |
| B | Time (EST) | HH:MM:SS AM/PM EST |
| C | Business Name | Name of the lead/business |
| D | Phone | Phone number (raw format, format in sheet as needed) |
| E | Street Address | Full street address |
| F | City | City name |
| G | State | State code (e.g., NY, CA) |
| H | Rating | Google rating (1-5) |
| I | Google Place ID | Unique Google Places identifier |
| J | Website | Business website URL |
| K | Times Called | Number of times this lead has been called |
| L | Outcome | Call outcome (blank for no_answer, or: left_vm, spoke_to_dm, callback, not_interested, appointment, close) |
| M | Notes | Call notes |
| N | Follow-up Date | YYYY-MM-DD format |
| O | Rep Email | Sales rep's email |
| P | Rep ID | Sales rep's ID |
| Q | Category | Business type/category (e.g., Dentist, Restaurant) |

### Sales Portal Features (`/sales-portal`)

- **Find Leads**: Search Google Places by state/city/category (defaults to NY, Dentist)
- **Reveal Contact**: Click to reveal phone/website (cached to avoid duplicate charges)
- **Log Calls**: Record call outcomes, notes, follow-up dates
- **Personal Stats**: View your calls today, appointments, closes, commissions
- **Leaderboard**: See today's top performers

### Admin Panel Features (`/admin/*`)

- **Overview** (`/admin`): MRR, customer count, rep count, calls today/week, closes, recent activity
- **Access Control** (`/admin/reps`): Manage sales reps (add/remove/edit roles)
- **Call Logs** (`/admin/calls`): View all logged calls with times called, outcomes, notes
- **Leads/Performance Pool** (`/admin/leads`): 
  - Total metrics (calls today, appointments, closes this month)
  - Representative breakdown (shows ALL sales_rep users, even with 0 calls)
  - All leads from Google Sheet
- **Customers** (`/admin/customers`): View all customers with plans, MRR, status
- **Settings** (`/admin/settings`): Admin configuration

### User Roles

Defined in `users.role` column in Supabase:
- `customer` - Regular business customer using the review platform
- `sales_rep` - Sales representative who can access Sales Portal
- `admin` - Full admin access

### API Endpoints

**Sales Portal APIs:**
- `POST /api/sales/leads/log-call` - Log a call to Google Sheets + database
- `POST /api/sales/leads/reveal-contact` - Reveal phone/website (checks DB cache first)
- `GET /api/sales/leaderboard` - Get today's top performers from Google Sheet
- `GET /api/sales/rep-stats` - Get individual rep stats from Google Sheet

**Admin APIs:**
- `GET /api/admin/overview` - Dashboard metrics (MRR from DB, calls from Sheet)
- `GET /api/admin/leads` - Performance pool + all leads from Google Sheet
- `GET /api/admin/calls` - All call logs from Google Sheet
- `GET /api/admin/customers` - All customers from database
- `GET /api/admin/reps` - All sales reps from database

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

Key Files for Sales/Admin Features
-----------------------------------

```
src/
├── app/
│   ├── (mkt)/
│   │   └── sales-portal/
│   │       └── page.tsx          # Sales Portal main page
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx          # Admin Overview (Business Overview)
│   │       ├── calls/page.tsx    # Call Logs
│   │       ├── leads/page.tsx    # Performance Pool
│   │       ├── customers/page.tsx # Customer Management
│   │       ├── reps/page.tsx     # Access Control (Rep Management)
│   │       └── settings/page.tsx # Admin Settings
│   └── api/
│       ├── admin/
│       │   ├── overview/route.ts # Dashboard metrics
│       │   ├── leads/route.ts    # Performance Pool data
│       │   ├── calls/route.ts    # Call logs from Sheet
│       │   └── customers/route.ts # Customer data
│       └── sales/
│           ├── leads/
│           │   ├── log-call/route.ts    # Log calls → Google Sheet
│           │   └── reveal-contact/route.ts # Reveal phone/website
│           ├── leaderboard/route.ts # Today's leaders
│           └── rep-stats/route.ts   # Individual rep stats
├── lib/
│   ├── googleSheets.ts           # Google Sheets API utilities
│   ├── googlePlaces.ts           # Google Places API utilities
│   ├── supabaseAdmin.ts          # Supabase admin client
│   └── firebaseAdmin.ts          # Firebase admin (also used for Sheets auth)
```

Troubleshooting
---------------

### Google Sheets Issues

**"#ERROR!" in Phone column:**
- The phone number may have been formatted as a formula. 
- Solution: Format the Phone column as "Plain text" in Google Sheets

**Calls not showing in admin panel:**
- Check `GOOGLE_SHEETS_ID` is set correctly in Vercel
- Verify the Firebase service account has edit access to the sheet
- Enable Google Sheets API in Google Cloud Console

**Date comparison issues:**
- Dates are stored in `MM/DD/YYYY` format with EST timezone
- The code normalizes dates (removes leading zeros) for comparison

### Database Issues

**"column does not exist" errors:**
- Some columns may not exist in your Supabase schema
- Run migrations or create missing columns manually

### Authentication

**Sales Portal access:**
- User must have `role = 'sales_rep'` in the `users` table
- Set role via Admin Panel → Access Control

**Admin Panel access:**
- User must have `role = 'admin'` or `role = 'sales_rep'` in the `users` table
- Or email must be in `NEXT_PUBLIC_ADMIN_EMAILS` env var

More docs
---------

See `docs/DEPLOYMENT.md` for full architecture, hosting, environment, and runbooks (Vercel + EB).
Last updated: Sat Jan 17 2026
