import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres({
  host: '44.208.221.186',
  port: 5432,
  database: 'postgres',
  username: 'postgres.rhnxzpbhoqbvoqyqmfox',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  prepare: false
});

async function main() {
  try {
    console.log('Running migrations with postgres library...');
    await sql.begin(async (sql) => {
      await sql`
        create table if not exists leads (
          id uuid primary key default gen_random_uuid(),
          google_place_id text unique not null,
          name text not null,
          address text,
          rating numeric,
          review_count integer default 0,
          business_type text,
          city text,
          state text,
          country text,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );
      `;
      console.log('Leads table created!');
      
      await sql`
        create table if not exists reps (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          email text unique not null,
          whatsapp text,
          status text not null default 'trial',
          tracking_code text unique not null,
          created_at timestamptz default now()
        );
      `;
      console.log('Reps table created!');

      await sql`
        create table if not exists call_log (
          id uuid primary key default gen_random_uuid(),
          rep_id uuid references reps(id) on delete cascade,
          lead_id uuid references leads(id) on delete cascade,
          timestamp timestamptz default now(),
          outcome text not null,
          created_at timestamptz default now()
        );
      `;
      console.log('Call_log table created!');
    });
    console.log('Migrations complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
