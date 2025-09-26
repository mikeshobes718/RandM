import { NextResponse } from 'next/server';
import { ensureFeedbackTables, isReviewEventName, recordReviewEvent } from '@/lib/feedbackStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampRating(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function sanitizeSource(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const cleaned = normalized
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  const sliced = cleaned.slice(0, 32);
  return sliced || undefined;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
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
    event,
    rating,
    metadata,
    source,
  } = body as Record<string, unknown>;

  if (typeof businessId !== 'string' || !businessId) {
    return new NextResponse('missing businessId', { status: 400 });
  }

  if (!isReviewEventName(event)) {
    return new NextResponse('invalid event', { status: 400 });
  }

  const normalizedRating = clampRating(rating);
  const eventMetadata = sanitizeMetadata(metadata) || {};
  const src = sanitizeSource(source);
  if (src && !eventMetadata.source) eventMetadata.source = src;

  try { await ensureFeedbackTables(); } catch {}

  await recordReviewEvent({
    businessId,
    event,
    rating: normalizedRating ?? undefined,
    metadata: Object.keys(eventMetadata).length ? eventMetadata : undefined,
  });

  return NextResponse.json({ ok: true });
}

