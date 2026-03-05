# Reviews & Marketing - Comprehensive System Architecture & Documentation

This document provides an exhaustive, literal, and detailed breakdown of every component, workflow, and system within the Reviews & Marketing platform.

## 1. Core Tech Stack
*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript / React
*   **Styling:** Tailwind CSS
*   **Authentication:** Firebase Auth (Client-side via `firebase/auth`, Server-side via `firebase-admin`)
*   **Database:** Supabase (PostgreSQL)
*   **Hosting & Deployment:** Vercel
*   **Email Provider:** Resend (Primary), Postmark (Fallback)
*   **SMS Provider:** Twilio
*   **PDF Generation:** `pdf-lib`

## 2. Database Schema (Supabase)
The system relies on several core tables in the `public` schema:

*   **`businesses`**: The core tenant table.
    *   Columns: `id` (UUID), `owner_uid` (Firebase UID), `name`, `slug` (URL-friendly identifier, e.g., `smart-fit`), `review_link` (Google Maps URL), `landing_headline`, `landing_subheading`, `created_at`.
*   **`contacts`**: Universal customer database for a business.
    *   Columns: `id`, `business_id`, `name`, `email`, `phone`, `source` (e.g., 'feedback', 'csv_upload', 'manual'), `created_at`.
*   **`contact_messages`**: Comprehensive log of all outbound communications (Email/SMS).
    *   Columns: `id`, `business_id`, `contact` (Email or Phone string), `channel` ('email' or 'sms'), `content` (Message body), `status` ('sent' or 'failed'), `error_message`, `created_at`.
*   **`campaigns`**: High-level tracking of bulk outreach efforts.
    *   Columns: `id`, `business_id`, `name`, `type` ('Email' or 'SMS'), `body`, `status`, `sent_count`, `click_count`, `metadata` (JSON containing `failed_count`, `last_error`, and `recipients` array with granular delivery status).
*   **`feedback`**: Stores 1-4 star private feedback submissions.
    *   Columns: `id`, `business_id`, `rating`, `feedback_text`, `customer_name`, `customer_email`, `customer_phone`, `source`, `archived` (boolean), `created_at`.
*   **`review_events`**: Tracks 5-star clicks (redirects to Google).
    *   Columns: `id`, `business_id`, `source`, `archived` (boolean), `created_at`.
*   **`review_contact_captures`**: Tracks optional contact info provided during 5-star flows.
    *   Columns: `id`, `business_id`, `name`, `email`, `phone`, `archived` (boolean), `created_at`.
*   **`profiles` / `subscriptions`**: Manages user billing state and Stripe integration.

## 3. Core Workflows & Logic

### A. Business Onboarding & Slugs
When a user creates an account and sets up their business, the system automatically generates a unique `slug` based on the business name (e.g., "Maman" -> `maman`). If a collision occurs, it appends an incrementing number (`maman-2`). This slug is used to generate clean, brandable QR code URLs (e.g., `reviewsandmarketing.com/r/maman`).

### B. Smart QR Engine & Review Routing (`/r/[id]`)
The customer-facing review page (`LandingClient.tsx`) dynamically loads the business name and branding using either the UUID or the `slug`.
1.  **5-Star Flow:** If a customer selects 5 stars, they are presented with a mandatory contact capture form (Name, Email, Phone). Upon submission, this data is saved to the `contacts` table, and a new tab opens (`window.open`) redirecting them to the business's Google Maps review link.
2.  **1-4 Star Flow:** If a customer selects 1-4 stars, they are presented with a private feedback form. They must provide either an email or phone number, and check a compliance consent box. Upon submission, the feedback is saved to the `feedback` table, and their contact info is upserted into the `contacts` table.

### C. Universal Contact Upsert Logic
Any time a customer submits information (via 5-star capture or 1-4 star private feedback), the API (`/api/feedback/submit/route.ts`) checks the `contacts` table. It searches for an existing contact matching the provided `email` OR `phone`. If found, it updates missing fields. If not found, it inserts a new row. This guarantees a unified, deduplicated customer database.

### D. Direct Outreach (Email & SMS)
From the Contacts page (`/contacts`), businesses can select customers and send bulk or individual messages.
1.  **Email (`/api/campaigns/send-email/route.ts`):** Uses Resend (via `emailService.ts`). The email template (`directOutreachEmail`) is heavily branded with the business's name in the header/footer and includes a legally required CAN-SPAM unsubscribe link.
2.  **SMS (`/api/campaigns/send-sms/route.ts`):** Uses Twilio. The system automatically prefixes the business name to the message if the user didn't include it (e.g., "Maman: Thank you for visiting!").
3.  **Logging Order:** Crucially, both routes insert individual message attempts (success or failure) into the `contact_messages` table *before* creating the overarching `campaigns` record. This ensures that even if a campaign record fails to save, the granular message history is preserved.

### E. Message History
The Contacts page features a "View Message History" modal. It calls `/api/contacts/messages/route.ts`, passing both the contact's `email` and `phone`. The API queries the `contact_messages` table using an `.or(contact.eq.${email},contact.eq.${phone})` condition, ensuring that both SMS (logged by phone) and Email (logged by email) history are retrieved for that specific customer. The Supabase JS client is used here to bypass direct `pg` connection SCRAM authentication issues.

## 4. Key UI Components

*   **`Dashboard` (`/dashboard`)**: The central hub. Displays the `PlanUsageCard` (conditionally hiding upgrade prompts for paid users), the `MultipleQrManager` (with a collapsible "Best Placement Guide"), and the `FeedbackInbox`.
*   **`FeedbackInbox`**: Displays recent feedback, events, and captures. Features an "Email" button (only visible if the contact provided an email) and an "Archive" button that updates the `archived` boolean across all three feedback-related tables.
*   **`ReviewRequestsModule`**: The outbound campaign tracker. Rows are expandable, revealing a granular breakdown of `metadata.recipients` to show exactly which contacts received the message and which failed (with specific error messages).
*   **`ProAnalytics`**: The charting component (Chart.js) at the bottom of the dashboard. Features clickable legend buttons that toggle the visibility of the "Reviews" and "Scans" datasets via React state.
*   **`ContactsPage` (`/contacts`)**: A robust data table with search, bulk selection, CSV import (with automatic header mapping), and dynamic outreach modals. Phone numbers are automatically formatted for display using `libphonenumber-js`.

## 5. Recent Stabilization Fixes (March 2026)
1.  **Review Landing Page Branding:** Fixed an issue where the `/r/[slug]` page displayed the default "Reviews & Marketing" title. It now correctly fetches and displays the dynamic business name in the `<h2>` header and `generateMetadata` tags.
2.  **Message History Logging:** Resolved an issue where sent emails were not appearing in the history modal. Fixed by migrating the insert/select logic from raw `pg` queries to the Supabase REST client, bypassing connection pooler SCRAM errors, and updating the query to check both email and phone identifiers.
3.  **PDF Generation:** Replaced a blank placeholder PDF with a dynamic Node.js script (`scripts/generate-one-pager.cjs`) using `pdf-lib` to generate a professional "One Page Overview" document containing setup instructions and staff scripts.
4.  **Campaign Error Details:** Enhanced the `ReviewRequestsModule` to parse campaign metadata and display per-recipient delivery statuses and exact error strings for failed sends, replacing generic error tooltips.
5.  **Email Deliverability:** Added necessary DNS records (DKIM, SPF, MX) for Resend to the `reviewsandmarketing.com` domain via Vercel CLI to prevent outreach emails from landing in spam.

## 6. Environment Variables
Required keys include:
*   `NEXT_PUBLIC_FIREBASE_*` (Client Auth)
*   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (Admin Auth)
*   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Database access)
*   `POSTMARK_SERVER_TOKEN`, `RESEND_API_KEY` (Email)
*   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (SMS)

---
*Document generated automatically to reflect the exact literal state of the application architecture, workflows, and recent patches.*
