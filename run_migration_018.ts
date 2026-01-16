import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const sql = postgres({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  username: 'postgres.rhnxzpbhoqbvoqyqmfox',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: 'require',
});

async function main() {
  console.log('Running migration 018...');
  try {
    await sql.begin(async (sql) => {
      // sql018
      await sql`alter table leads add column if not exists times_called integer default 0`;
      await sql`alter table leads add column if not exists last_called_at timestamptz`;
      await sql`alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null`;
      await sql`alter table leads add column if not exists call_status text default 'fresh' check (call_status in ('fresh', 'no answer', 'callback', 'not interested', 'closed'))`;
      await sql`alter table leads add column if not exists next_followup date`;
      await sql`alter table leads add column if not exists lead_notes text`;

      await sql`
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
      `;

      await sql`create index if not exists call_log_rep_id_idx on call_log(rep_id)`;
      await sql`create index if not exists call_log_lead_id_idx on call_log(lead_id)`;
      await sql`create index if not exists call_log_timestamp_idx on call_log(timestamp)`;
    });
    console.log('Migration 018 complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
