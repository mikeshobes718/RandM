import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT,
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Running migrations with pg library (from .env.local)...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Running 017...');
    await client.query(`
      create table if not exists reps (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        email text unique not null,
        whatsapp text,
        payment_method text check (payment_method in ('Wise', 'Payoneer')),
        payment_id text,
        status text not null default 'trial' check (status in ('trial', 'active', 'inactive', 'dropped')),
        start_date timestamptz default now(),
        tracking_code text unique not null,
        notes text,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
    `);
    
    await client.query(`alter table leads add column if not exists assigned_to uuid references reps(id) on delete set null`);
    await client.query(`alter table leads add column if not exists status text default 'fresh' check (status in ('fresh', 'called', 'follow-up', 'closed', 'dead'))`);
    await client.query(`alter table leads add column if not exists last_contact timestamptz`);

    await client.query(`
      create table if not exists commissions (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        business_id uuid references businesses(id) on delete cascade,
        type text not null check (type in ('close', 'month2', 'month3', 'bonus')),
        amount numeric not null,
        earned_date timestamptz default now(),
        status text not null default 'pending' check (status in ('pending', 'processing', 'paid')),
        paid_date timestamptz,
        created_at timestamptz default now()
      );
    `);

    await client.query(`
      create table if not exists payouts (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        amount numeric not null,
        date_paid timestamptz default now(),
        method text check (method in ('Wise', 'Payoneer')),
        reference text,
        commission_ids uuid[],
        created_at timestamptz default now()
      );
    `);

    await client.query(`
      create table if not exists admin_settings (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz default now()
      );
    `);

    await client.query(`
      insert into admin_settings (key, value) values 
      ('commission_structure', '{"first_close_percent": 100, "month2_retention_percent": 25, "month3_retention_percent": 25, "bonus_10_closes": 100, "bonus_20_closes": 250}'::jsonb)
      on conflict (key) do nothing;
    `);

    console.log('Running 018...');
    await client.query(`alter table leads add column if not exists times_called integer default 0`);
    await client.query(`alter table leads add column if not exists last_called_at timestamptz`);
    await client.query(`alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null`);
    await client.query(`alter table leads add column if not exists call_status text default 'fresh' 
      check (call_status in ('fresh', 'no answer', 'callback', 'not interested', 'closed'))`);
    await client.query(`alter table leads add column if not exists next_followup date`);
    await client.query(`alter table leads add column if not exists lead_notes text`);

    await client.query(`
      create table if not exists call_log (
        id uuid primary key default gen_random_uuid(),
        rep_id uuid not null references reps(id) on delete cascade,
        lead_id uuid not null references leads(id) on delete cascade,
        timestamp timestamptz default now(),
        outcome text not null check (outcome in ('no answer', 'left vm', 'spoke to dm', 'not interested', 'closed')),
        notes text,
        followup_date date,
        created_at timestamptz default now()
      );
    `);

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
