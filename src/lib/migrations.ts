import { getEnv } from './env';
import { getPgPool } from './supabaseAdmin';

function getProjectRef(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.host; // e.g., rhnxzpbhoqbvoqyqmfox.supabase.co
    const parts = host.split('.');
    return parts[0] || null;
  } catch {
    return null;
  }
}

export async function runSupabaseMigrations(): Promise<{ ran: string[] }> {
  const env = getEnv();
  const ref = getProjectRef(env.SUPABASE_URL || '') || '';
  void ref;
  const pool = getPgPool();
  if (!pool) throw new Error('pg not configured (missing SUPABASE_DB_* envs)');
  const client = await pool.connect();
  try {
    const ran: string[] = [];
    // 000 - base schema
    const sql000 = `
create extension if not exists pgcrypto;
create table if not exists users (
  uid text primary key,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_uid text not null references users(uid) on delete cascade,
  name text not null,
  google_place_id text,
  google_rating numeric,
  review_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create type if not exists request_status as enum ('queued','sent','clicked','reviewed','bounced','failed');
create type if not exists request_channel as enum ('email','sms');

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  channel request_channel not null default 'email',
  status request_status not null default 'queued',
  google_place_id text,
  review_link text,
  provider_message_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stripe_customers (
  uid text primary key references users(uid) on delete cascade,
  stripe_customer_id text unique not null
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  uid text not null references users(uid) on delete cascade,
  stripe_subscription_id text unique not null,
  plan_id text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists email_log (
  id bigserial primary key,
  provider text not null,
  to_email text not null,
  template text,
  status text,
  provider_message_id text,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists webhook_events (
  id text primary key,
  type text,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists place_cache (
  place_id text primary key,
  data jsonb not null,
  fetched_at timestamptz default now()
);
 
create type if not exists square_backfill_status as enum ('pending','running','completed','failed');

create table if not exists square_connections (
  uid text primary key references users(uid) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  merchant_id text,
  default_location_id text,
  sandbox boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_backfill_at timestamptz
);

create table if not exists square_backfill_jobs (
  id uuid primary key default gen_random_uuid(),
  uid text not null references users(uid) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  status square_backfill_status not null default 'pending',
  requested_range_start timestamptz,
  requested_range_end timestamptz,
  filters jsonb,
  total_customers integer,
  sent_count integer default 0,
  skipped_count integer default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create unique index if not exists customers_business_email_unique on customers (business_id, email);
`;
    const sql004 = `
create table if not exists business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  uid text not null references users(uid) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  added_at timestamptz default now(),
  primary key (business_id, uid)
);
`;
    const sql005 = `
create table if not exists member_invites (
  token text primary key,
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','member','viewer')),
  invited_by text references users(uid) on delete set null,
  invited_at timestamptz default now(),
  accepted_by text references users(uid) on delete set null,
  accepted_at timestamptz
);
`;
    await client.query('begin');
    await client.query(sql000); ran.push('000_base_schema');
    await client.query(sql004); ran.push('004_business_members');
    await client.query(sql005); ran.push('005_member_invites');
    const sql006 = `
create unique index if not exists businesses_owner_uid_key on businesses(owner_uid);
`;
    await client.query(sql006); ran.push('006_business_owner_uid_unique');
    const sql007 = `
alter table businesses add column if not exists google_maps_place_uri text;
alter table businesses add column if not exists google_maps_write_review_uri text;
alter table businesses add column if not exists address text;
`;
    await client.query(sql007); ran.push('007_business_google_columns');
    const sql008 = `
alter table businesses add column if not exists landing_brand_color text;
alter table businesses add column if not exists landing_button_color text;
alter table businesses add column if not exists landing_logo_url text;
alter table businesses add column if not exists landing_headline text;
alter table businesses add column if not exists landing_subheading text;
`;
    await client.query(sql008); ran.push('008_business_landing_branding');
    await client.query('commit');
    return { ran };
  } catch (e) {
    try { await client.query('rollback'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
