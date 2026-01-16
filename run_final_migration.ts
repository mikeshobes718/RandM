import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const sql = postgres({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.rhnxzpbhoqbvoqyqmfox',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  prepare: false,
});

async function main() {
  console.log('Running final migration attempt...');
  try {
    await sql`
      -- Update leads table
      alter table leads add column if not exists times_called integer default 0;
      alter table leads add column if not exists last_called_at timestamptz;
      alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null;
      alter table leads add column if not exists call_status text default 'fresh' 
        check (call_status in ('fresh', 'no answer', 'callback', 'not interested', 'closed'));
      alter table leads add column if not exists next_followup date;
      alter table leads add column if not exists lead_notes text;

      -- Create call_log table
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

      create index if not exists call_log_rep_id_idx on call_log(rep_id);
      create index if not exists call_log_lead_id_idx on call_log(lead_id);
      create index if not exists call_log_timestamp_idx on call_log(timestamp);
    `;
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
