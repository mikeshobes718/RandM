import { NextResponse } from 'next/server';
import { requireUid } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSquareConnectionForUser, getSquareClient, createBackfillJob, markBackfillCompleted, markBackfillFailed, touchSquareLastBackfill } from '@/lib/square';
import { hasActivePro } from '@/lib/entitlements';
import { getPostmarkClient } from '@/lib/postmark';
import { getEnv } from '@/lib/env';
import { reviewRequestEmail } from '@/lib/emailTemplates';
import { makeGoogleReviewLinkFromWriteUri } from '@/lib/googlePlaces';
import { Client, ApiError } from 'square';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;
const RECENT_REQUEST_WINDOW_DAYS = 90;

type BackfillRequestBody = {
  businessId?: string;
  startDate?: string | null;
  endDate?: string | null;
  dryRun?: boolean;
  maxCustomers?: number;
};

type SquareCustomer = NonNullable<Awaited<ReturnType<Client['customersApi']['listCustomers']>>['result']['customers']>[number];

type CandidateCustomer = {
  source: SquareCustomer;
  email: string;
  givenName: string | null;
  familyName: string | null;
  phoneNumber: string | null;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function withinRange(customer: SquareCustomer, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const created = customer.createdAt ? new Date(customer.createdAt) : null;
  if (!created || Number.isNaN(created.getTime())) return false;
  if (start && created < start) return false;
  if (end && created > end) return false;
  return true;
}

function normaliseEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

async function fetchCandidates(client: Client, start: Date | null, end: Date | null, limit: number): Promise<CandidateCustomer[]> {
  const customers: CandidateCustomer[] = [];
  let cursor: string | undefined;
  do {
    const response = await client.customersApi.listCustomers(cursor);
    const list = response.result?.customers ?? [];
    for (const customer of list) {
      if (!withinRange(customer, start, end)) continue;
      const email = normaliseEmail((customer as { emailAddress?: string }).emailAddress ?? null);
      if (!email) continue;
      customers.push({
        source: customer,
        email,
        givenName: (customer as { givenName?: string | null }).givenName ?? null,
        familyName: (customer as { familyName?: string | null }).familyName ?? null,
        phoneNumber: (customer as { phoneNumber?: string | null }).phoneNumber ?? null,
      });
      if (customers.length >= limit) return customers;
    }
    cursor = response.result?.cursor ?? undefined;
  } while (cursor && customers.length < limit);
  return customers;
}

export async function POST(req: Request) {
  const uid = await requireUid().catch(() => null);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const body = (await req.json().catch(() => ({}))) as BackfillRequestBody | null;
  const businessId = body?.businessId?.trim();
  if (!businessId) {
    return new NextResponse('Missing businessId', { status: 400 });
  }

  const start = parseDate(body?.startDate);
  const end = parseDate(body?.endDate);
  if (start && end && start > end) {
    return new NextResponse('startDate must be before endDate', { status: 400 });
  }

  const limit = Math.min(Math.max(1, body?.maxCustomers ?? DEFAULT_LIMIT), MAX_LIMIT);
  const dryRun = Boolean(body?.dryRun);

  const supa = getSupabaseAdmin();
  const { data: business, error: businessError } = await supa
    .from('businesses')
    .select('id, owner_uid, review_link, google_maps_write_review_uri, google_place_id, name')
    .eq('id', businessId)
    .maybeSingle();
  if (businessError) return new NextResponse(businessError.message, { status: 500 });
  if (!business || business.owner_uid !== uid) {
    return new NextResponse('Business not found', { status: 404 });
  }

  const pro = await hasActivePro(uid);
  if (!pro) {
    return new NextResponse('Backfill is available to Pro accounts only', { status: 403 });
  }

  const connection = await getSquareConnectionForUser(uid);
  if (!connection) {
    return new NextResponse('Square account not connected', { status: 409 });
  }

  const job = await createBackfillJob({
    uid,
    businessId,
    status: 'running',
    requestedStart: start ? start.toISOString() : null,
    requestedEnd: end ? end.toISOString() : null,
    filters: { dryRun, limit },
  });

  const client = getSquareClient(connection);

  try {
    const candidates = await fetchCandidates(client, start, end, limit);
    const considered = candidates.length;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - RECENT_REQUEST_WINDOW_DAYS);
    const cutoffIso = cutoff.toISOString();

    const postmark = getPostmarkClient();
    const { EMAIL_FROM } = getEnv();

    const link = business.review_link || makeGoogleReviewLinkFromWriteUri(business.google_maps_write_review_uri || undefined, business.google_place_id || undefined);

    let sent = 0;
    let skipped = 0;
    const results: { email: string; status: 'sent' | 'skipped' | 'would_send'; reason?: string }[] = [];

    for (const candidate of candidates) {
      const nameParts = [candidate.givenName ?? '', candidate.familyName ?? ''].map((p) => p.trim()).filter(Boolean);
      const fullName = nameParts.join(' ') || null;

      const { data: existing, error: existingErr } = await supa
        .from('customers')
        .select('id, name, email, phone')
        .eq('business_id', businessId)
        .eq('email', candidate.email)
        .maybeSingle();
      if (existingErr) throw existingErr;

      let customerId = existing?.id ?? null;

      if (!existing) {
        const { data: inserted, error: insertErr } = await supa
          .from('customers')
          .insert({
            business_id: businessId,
            email: candidate.email,
            name: fullName,
            phone: candidate.phoneNumber,
          })
          .select('id')
          .maybeSingle();
        if (insertErr || !inserted) throw insertErr ?? new Error('Failed to insert customer');
        customerId = inserted.id;
      } else {
        const needUpdate = (fullName && fullName !== existing.name) || (candidate.phoneNumber && candidate.phoneNumber !== existing.phone);
        if (needUpdate) {
          await supa
            .from('customers')
            .update({ name: fullName ?? existing.name, phone: candidate.phoneNumber ?? existing.phone })
            .eq('id', existing.id);
        }
      }

      if (!customerId) {
        skipped += 1;
        results.push({ email: candidate.email, status: 'skipped', reason: 'customer_insert_failed' });
        continue;
      }

      const { count: recentCount, error: recentErr } = await supa
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('customer_id', customerId)
        .gte('created_at', cutoffIso);
      if (recentErr) throw recentErr;
      if ((recentCount || 0) > 0) {
        skipped += 1;
        results.push({ email: candidate.email, status: 'skipped', reason: 'recent_request' });
        continue;
      }

      if (dryRun) {
        sent += 1;
        results.push({ email: candidate.email, status: 'would_send' });
        continue;
      }

      if (!link) {
        skipped += 1;
        results.push({ email: candidate.email, status: 'skipped', reason: 'missing_review_link' });
        continue;
      }

      const template = reviewRequestEmail(fullName ?? candidate.email, link);
      const response = await postmark.sendEmail({
        From: EMAIL_FROM,
        To: candidate.email,
        Subject: template.subject,
        HtmlBody: template.html,
        TextBody: template.text,
        MessageStream: 'outbound',
      });
      const messageId = (response as unknown as { MessageID?: string }).MessageID || null;

      const { error: insertRequestErr } = await supa.from('review_requests').insert({
        business_id: businessId,
        customer_id: customerId,
        status: 'sent',
        review_link: link,
        provider_message_id: messageId,
      });
      if (insertRequestErr) throw insertRequestErr;

      sent += 1;
      results.push({ email: candidate.email, status: 'sent' });
    }

    await markBackfillCompleted(job.id, { total: considered, sent, skipped });
    if (!dryRun) {
      await touchSquareLastBackfill(uid);
    }

    return NextResponse.json({
      jobId: job.id,
      totalConsidered: considered,
      sent,
      skipped,
      dryRun,
      results,
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Square backfill failed';
    await markBackfillFailed(job.id, message);
    return new NextResponse(message, { status: 500 });
  }
}
