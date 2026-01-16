import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  host: '44.208.221.186',
  port: 5432,
  database: 'postgres',
  user: 'postgres.rhnxzpbhoqbvoqyqmfox',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Running all pending migrations with pg driver (no transaction)...');
  const client = await pool.connect();
  try {
    // sql017
    console.log('Running sql017 parts...');
    try {
      await client.query(`create table if not exists reps (
        id uuid primary key default gen_random_uuid(),
        uid text unique references users(uid) on delete cascade,
        name text not null,
        email text unique not null,
        whatsapp text,
        payment_method text,
        payment_id text,
        status text not null default 'trial',
        start_date timestamptz default now(),
        tracking_code text unique not null,
        notes text,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      )`);
    } catch (e) { console.log('reps table might exist or failed:', e.message); }
    
    // ... continue for other tables ...
    await client.query(`create table if not exists reps (
        id uuid primary key default gen_random_uuid(),
        uid text unique references users(uid) on delete cascade,
        name text not null,
        email text unique not null,
        whatsapp text,
        payment_method text,
        payment_id text,
        status text not null default 'trial',
        start_date timestamptz default now(),
        tracking_code text unique not null,
        notes text,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      )`);
    await client.query(`create table if not exists commissions (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        customer_id uuid references customers(id) on delete set null,
        type text not null,
        amount numeric not null,
        earned_date timestamptz default now(),
        status text not null default 'pending',
        paid_date timestamptz,
        created_at timestamptz default now()
      )`);
    await client.query(`create table if not exists payouts (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        amount numeric not null,
        date_paid timestamptz default now(),
        method text,
        reference text,
        commission_ids uuid[],
        created_at timestamptz default now()
      )`);
    await client.query(`create table if not exists admin_settings (
        id uuid primary key default gen_random_uuid(),
        setting_key text unique not null,
        setting_value jsonb,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      )`);

    await client.query(`alter table leads add column if not exists assigned_to uuid references reps(id) on delete set null`);
    await client.query(`alter table leads add column if not exists status text default 'fresh'`);
    await client.query(`alter table leads add column if not exists last_contact timestamptz`);

    await client.query(`alter table customers add column if not exists closed_by uuid references reps(id) on delete set null`);
    await client.query(`alter table customers add column if not exists plan text`);
    await client.query(`alter table customers add column if not exists mrr numeric`);
    await client.query(`alter table customers add column if not exists signed_up_date timestamptz`);
    await client.query(`alter table customers add column if not exists status text default 'trial'`);
    await client.query(`alter table customers add column if not exists stripe_customer_id text`);
    await client.query(`alter table customers add column if not exists notes text`);

    // sql018
    console.log('Running sql018 parts...');
    await client.query(`alter table leads add column if not exists times_called integer default 0`);
    await client.query(`alter table leads add column if not exists last_called_at timestamptz`);
    await client.query(`alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null`);
    await client.query(`alter table leads add column if not exists call_status text default 'fresh'`);
    await client.query(`alter table leads add column if not exists next_followup date`);
    await client.query(`alter table leads add column if not exists lead_notes text`);

    await client.query(`create table if not exists call_log (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        lead_id uuid not null references leads(id) on delete cascade,
        timestamp timestamptz default now(),
        outcome text not null,
        notes text,
        followup_date date,
        created_at timestamptz default now()
      )`);

    await client.query(`create index if not exists call_log_rep_id_idx on call_log(rep_id)`);
    await client.query(`create index if not exists call_log_lead_id_idx on call_log(lead_id)`);
    await client.query(`create index if not exists call_log_timestamp_idx on call_log(timestamp)`);

    await client.query('COMMIT');
    console.log('Migrations complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
