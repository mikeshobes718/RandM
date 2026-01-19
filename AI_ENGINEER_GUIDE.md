# 🤖 AI Agent & Engineer Technical Guide

This guide is designed for any AI agent or engineer inheriting this codebase. It documents the "hidden" logic, critical infrastructure, and common fixes implemented as of January 19, 2026.

## 🏗️ System Architecture

### Core Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Firebase Authentication (Client-side) with Session Cookies (Server-side)
- **Messaging**: 
  - **Email**: Postmark (Primary) + Resend (Fallback)
  - **SMS**: Twilio
- **External Storage**: Google Sheets (Used for Sales Tracking and Call Logs)
- **API integrations**: Google Places API (Leads)

---

## 💾 Database & Schema Management

### The "Schema Cache" Problem
Supabase's PostgREST API often fails with `404 Not Found` or `column does not exist` immediately after a schema change (like adding a table or column).
- **Solution**: We use a dual-approach:
  1. **Direct SQL**: Use `getSql()` from `@/lib/supabaseAdmin` to run raw queries via the `postgres` library. This bypasses the cache entirely.
  2. **Manual Reload**: After any DDL change (CREATE TABLE, etc.), we call `NOTIFY pgrst, 'reload schema'` to force the cache to refresh.

### Important Tables
1. **`review_sources`**: Tracks different QR code origins (Lobby, Table 1, etc.).
2. **`contacts`**: Stores business customers for outreach. Normalized emails and E.164 phones.
3. **`campaigns`**: Tracks SMS/Email blasts (sent counts, click counts).
4. **`review_requests`**: Individual records of every message sent to a customer.
5. **`review_events`**: Tracks every interaction (page opened, QR scanned, link clicked).

---

## 📞 Sales Portal & Reveal Logic

### The Multi-Tiered Cache (Cost Savings)
Every phone reveal costs money ($0.025). We minimize this using this priority:
1. **Check "Reveals" Google Sheet**: If the `googlePlaceId` exists there, use it.
2. **Check Supabase `businesses` table**: If the phone is already stored, use it.
3. **Call Google Places API**: Only if 1 & 2 fail.
4. **`NO_PHONE` Marker**: If Google says there is no phone, we save `NO_PHONE` to the sheet/DB so we never check that business again.

---

## 📧 Email & SMS Campaigns

### Robust Email Sending
- **Service**: `src/lib/emailService.ts`
- **Logic**: Tries Postmark first. If it fails (e.g., recipient is suppressed), it attempts to reactivate them and retries. If Postmark is completely down, it falls back to Resend.
- **Templates**: All emails use `brandedHtml` in `src/lib/emailTemplates.ts` for a premium dark-mode safe design.

### Twilio Integration
- **Formatting**: We use `libphonenumber-js` on the frontend (`src/app/(app)/contacts/page.tsx`) to ensure phones are E.164 format before they ever hit the database.
- **Config**: Twilio requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`. We also support API Key/Secret via `TWILIO_API_KEY_SID`.

---

## 📈 QR Code Tracking

### "Main QR" vs Custom Sources
- **The Default**: Every business has a "Main QR" by default. This is **virtual**; it doesn't always exist in the `review_sources` table.
- **Logic**: In `src/app/api/review-sources/list/route.ts`, we manually inject the "Main QR" into the results and aggregate its scan counts from `review_events` where the source is `landing`, `main-qr`, or `NULL`.

---

## 🔧 Developer Tools & Maintenance

### Emergency Database Init
If the database tables are missing or out of sync:
1. Visit `https://www.reviewsandmarketing.com/api/admin/db-init`.
2. This route executes the core SQL required to set up `contacts`, `campaigns`, `review_sources`, and the `execute_sql` utility function.

### Deployment Guide (Vercel)
- **Command**: `vercel --prod --yes`
- **Critical**: If changes don't appear live, verify the **Domain Alias** in the Vercel dashboard. Sometimes Vercel fails to move the production domain to the latest successful build.

### Environment Variables (Vercel Dashboard)
- `FIREBASE_SERVICE_ACCOUNT_B64`: Required for Google Sheets & Auth.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Required for SMS.
- `POSTMARK_SERVER_TOKEN`: Required for Email.
- `SUPABASE_DB_URL`: Required for direct SQL queries (`getSql`).

---

## ⚖️ Compliance Logic
We use **"Review Routing"** (formerly "Review Gating").
- **Positive Feedback**: Guided to Google Reviews.
- **Negative Feedback**: Captured privately via a form.
- **Copy Policy**: Never use the words "filter" or "gate" in marketing copy. Always use "Routing" or "Feedback Loop."

---

## 🛑 Common Pitfalls
1. **Disappearing Tracking Codes**: Usually a race condition between a POST and a GET. Use `setTimeout` or local state "trusting" to keep the UI snappy.
2. **Google Sheets Permissions**: The Firebase service account email MUST have "Editor" access to the spreadsheet.
3. **Twilio Trial Limits**: Messages only work for "Verified Caller IDs" in Twilio until the account is upgraded.

---
*Last Updated: January 19, 2026*
