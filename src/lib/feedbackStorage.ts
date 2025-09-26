import { Pool } from 'pg';
import { getSupabaseAdmin } from './supabaseAdmin';

export type ReviewEventName = 'page_opened' | 'rating_selected' | 'feedback_submitted' | 'google_opened';

const REVIEW_EVENT_SET: Set<ReviewEventName> = new Set([
  'page_opened',
  'rating_selected',
  'feedback_submitted',
  'google_opened',
]);

let ensurePromise: Promise<void> | null = null;

function resolveDbConfig() {
  const url = process.env.SUPABASE_URL || '';
  let host = process.env.SUPABASE_DB_HOST || '';
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || '';
  const port = Number(process.env.SUPABASE_DB_PORT || '5432');
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const database = process.env.SUPABASE_DB_NAME || 'postgres';

  if (!host && url) {
    try {
      const ref = new URL(url).host.split('.')[0];
      if (ref) host = `db.${ref}.supabase.co`;
    } catch {
      // ignore parse errors
    }
  }
  if (!host || !password) return null;
  return { host, port, user, password, database } as const;
}

export function isReviewEventName(input: unknown): input is ReviewEventName {
  return typeof input === 'string' && REVIEW_EVENT_SET.has(input as ReviewEventName);
}

export async function ensureFeedbackTables(): Promise<void> {
  const config = resolveDbConfig();
  if (!config) return;
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: { rejectUnauthorized: false },
    });
    const client = await pool.connect();
    try {
      await client.query(`
        create table if not exists feedback (
          id uuid primary key default gen_random_uuid(),
          business_id uuid not null references businesses(id) on delete cascade,
          rating int not null check (rating between 1 and 5),
          name text,
          email text,
          phone text,
          comment text,
          marketing_consent boolean,
          created_at timestamptz default now()
        );
        alter table feedback add column if not exists marketing_consent boolean;
        create index if not exists ix_feedback_business_created on feedback (business_id, created_at desc);
      `);
      await client.query(`
        create table if not exists review_events (
          id uuid primary key default gen_random_uuid(),
          business_id uuid not null references businesses(id) on delete cascade,
          event text not null,
          rating int,
          metadata jsonb,
          created_at timestamptz default now()
        );
        create index if not exists ix_review_events_business_created on review_events (business_id, created_at desc);
        create index if not exists ix_review_events_event_created on review_events (event, created_at desc);
      `);
    } finally {
      client.release();
      await pool.end();
    }
  })();
  try {
    await ensurePromise;
  } catch (err) {
    ensurePromise = null;
    throw err;
  }
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
  const metadata = toJsonMetadata(opts.metadata);
  let createdAt: string | undefined;
  if (opts.at instanceof Date) {
    const ms = opts.at.valueOf();
    if (!Number.isNaN(ms)) createdAt = new Date(ms).toISOString();
  } else if (typeof opts.at === 'string' && opts.at) {
    const parsed = new Date(opts.at);
    if (!Number.isNaN(parsed.valueOf())) createdAt = parsed.toISOString();
  }

  try {
    await ensureFeedbackTables();
  } catch {
    // continue even if ensure fails; Supabase insert may still succeed if table already exists
  }

  const supa = getSupabaseAdmin();
  try {
    const { error } = await supa.from('review_events').insert({
      business_id: businessId,
      event,
      rating: rating == null ? null : Math.max(1, Math.min(5, Math.round(rating))),
      metadata,
      created_at: createdAt,
    });
    if (!error) return;
  } catch {
    // swallow and try PG fallback
  }

  const config = resolveDbConfig();
  if (!config) return;
  try {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: { rejectUnauthorized: false },
    });
    const client = await pool.connect();
    try {
      await client.query(
        `insert into review_events (business_id, event, rating, metadata, created_at)
         values ($1, $2, $3, $4, coalesce($5, now()))`,
        [
          businessId,
          event,
          rating == null ? null : Math.max(1, Math.min(5, Math.round(Number(rating)))),
          metadata ? JSON.stringify(metadata) : null,
          createdAt ? new Date(createdAt) : null,
        ],
      );
    } finally {
      client.release();
      await pool.end();
    }
  } catch {
    // final fallback ignored
  }
}
