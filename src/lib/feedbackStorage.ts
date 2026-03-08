import { getSupabaseAdmin } from './supabaseAdmin';

export type ReviewEventName = 'page_opened' | 'rating_selected' | 'feedback_submitted' | 'google_opened';

const REVIEW_EVENT_SET: Set<ReviewEventName> = new Set([
  'page_opened',
  'rating_selected',
  'feedback_submitted',
  'google_opened',
]);

export function isReviewEventName(input: unknown): input is ReviewEventName {
  return typeof input === 'string' && REVIEW_EVENT_SET.has(input as ReviewEventName);
}

function toJsonMetadata(input: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!input) return null;
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return null;
  }
}

export async function recordReviewEvent(opts: {
  businessId: string;
  event: ReviewEventName;
  rating?: number | null;
  metadata?: Record<string, unknown> | null;
  at?: Date | string;
}): Promise<void> {
  const { businessId, event } = opts;
  if (!businessId || !event) return;

  const rating = typeof opts.rating === 'number' ? opts.rating : opts.rating != null ? Number(opts.rating) : null;
  const clampedRating = rating == null ? null : Math.max(1, Math.min(5, Math.round(rating)));
  const metadata = toJsonMetadata(opts.metadata);

  let createdAt: string | undefined;
  if (opts.at instanceof Date) {
    const ms = opts.at.valueOf();
    if (!Number.isNaN(ms)) createdAt = new Date(ms).toISOString();
  } else if (typeof opts.at === 'string' && opts.at) {
    const parsed = new Date(opts.at);
    if (!Number.isNaN(parsed.valueOf())) createdAt = parsed.toISOString();
  }

  const supa = getSupabaseAdmin();
  const { error } = await supa.from('review_events').insert({
    business_id: businessId,
    event,
    rating: clampedRating,
    metadata,
    created_at: createdAt,
  });

  if (error) {
    console.error('[recordReviewEvent] Insert failed:', error.message);
  }
}
