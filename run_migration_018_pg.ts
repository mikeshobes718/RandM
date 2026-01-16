import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.rhnxzpbhoqbvoqyqmfox',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Running migration 018 with pg driver...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`alter table leads add column if not exists times_called integer default 0`);
    await client.query(`alter table leads add column if not exists last_called_at timestamptz`);
    await client.query(`alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null`);
    await client.query(`alter table leads add column if not exists call_status text default 'fresh' check (call_status in ('fresh', 'no answer', 'callback', 'not interested', 'closed'))`);
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
      )
    `);

    await client.query(`create index if not exists call_log_rep_id_idx on call_log(rep_id)`);
    await client.query(`create index if not exists call_log_lead_id_idx on call_log(lead_id)`);
    await client.query(`create index if not exists call_log_timestamp_idx on call_log(timestamp)`);

    await client.query('COMMIT');
    console.log('Migration 018 complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
