import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureFeedbackTables, recordReviewEvent } from '@/lib/feedbackStorage';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeString(value: unknown, max = 255): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.slice(0, max);
}

function sanitizeComment(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\r\n?/g, '\n');
  const trimmed = normalized.trim();
  if (!trimmed) return '';
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function sanitizeSource(value: unknown): string {
  if (typeof value !== 'string') return 'landing';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'landing';
  const cleaned = normalized
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  const sliced = cleaned.slice(0, 32);
  return sliced || 'landing';
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
  }
  return false;
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('invalid payload', { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return new NextResponse('invalid payload', { status: 400 });
  }

  const {
    businessId,
    rating,
    name,
    email,
    phone,
    comment,
    source,
    consent,
  } = body as Record<string, unknown>;

  if (typeof businessId !== 'string' || !businessId) {
    return new NextResponse('missing businessId', { status: 400 });
  }

  const ratingNumber = Number(rating);
  if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return new NextResponse('invalid rating', { status: 400 });
  }
  const normalizedRating = Math.round(ratingNumber);

  const sanitizedName = sanitizeString(name, 160);
  const sanitizedEmail = sanitizeString(email, 190).toLowerCase();
  const sanitizedPhoneDigitsRaw = normalizePhone(typeof phone === 'string' ? phone : '');
  const sanitizedPhoneDigits = sanitizedPhoneDigitsRaw.slice(0, 10);
  const sanitizedComment = sanitizeComment(comment, 4000);
  const marketingConsent = toBoolean(consent);
  const entrySource = sanitizeSource(source);

  if (normalizedRating < 5) {
    if (!sanitizedComment || !sanitizedName || !sanitizedEmail) {
      return new NextResponse('Please include your name, email, and feedback so we can follow up.', { status: 400 });
    }
    if (!isValidEmail(sanitizedEmail)) {
      return new NextResponse('Enter a valid email address so we can stay in touch.', { status: 400 });
    }
  }

  const supa = getSupabaseAdmin();
  const baseColumns = 'id,name,google_maps_write_review_uri,review_link';
  let { data: biz, error } = await supa
    .from('businesses')
    .select(baseColumns)
    .eq('id', businessId)
    .maybeSingle();

  if (error && /column/.test(error.message || '')) {
    const fallback = await supa
      .from('businesses')
      .select('id,name,review_link')
      .eq('id', businessId)
      .maybeSingle();
    if (fallback.data) {
      biz = fallback.data as typeof biz;
      error = fallback.error ?? null;
    }
  }

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!biz) return new NextResponse('not found', { status: 404 });

  try { await ensureFeedbackTables(); } catch {}

  let feedbackId: string | null = null;
  if (normalizedRating < 5) {
    try {
      const { data, error: insertError } = await supa
        .from('feedback')
        .insert({
          business_id: businessId,
          rating: normalizedRating,
          name: sanitizedName || null,
          email: sanitizedEmail || null,
          phone: sanitizedPhoneDigits || null,
          comment: sanitizedComment || null,
          marketing_consent: marketingConsent,
        })
        .select('id')
        .single();
      if (!insertError && data?.id) feedbackId = data.id;
    } catch {
      // ignore insert error; feedback table may not exist yet or REST may be unavailable
    }
  }

  const redirect = normalizedRating >= 5
    ? (biz.google_maps_write_review_uri || biz.review_link || '')
    : '';

  const meta: Record<string, unknown> = { source: entrySource };
  if (feedbackId) meta.feedback_id = feedbackId;
  if (sanitizedComment) meta.has_comment = true;
  if (marketingConsent) meta.marketing_consent = true;
  if (sanitizedPhoneDigits.length === 10) meta.has_phone = true;

  if (normalizedRating < 5) {
    await recordReviewEvent({
      businessId: biz.id,
      event: 'feedback_submitted',
      rating: normalizedRating,
      metadata: meta,
    });
  } else {
    if (redirect) meta.redirect = redirect;
    await recordReviewEvent({
      businessId: biz.id,
      event: 'google_opened',
      rating: normalizedRating,
      metadata: meta,
    });
  }

  return NextResponse.json({ ok: true, redirect: redirect || undefined });
}
