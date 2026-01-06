import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectRef = 'rhnxzpbhoqbvoqyqmfox';
const user = `postgres.${projectRef}`;
const password = process.env.SUPABASE_DB_PASSWORD || '';
const host = `aws-0-us-east-1.pooler.supabase.com`; // Common pooler host
const database = 'postgres';

const sql = postgres(`postgresql://${user}:${encodeURIComponent(password)}@${host}:6543/${database}`, {
  ssl: 'require',
});

async function main() {
  console.log('Running migrations with postgres.js (transaction port 6543)...');
  try {
    await sql.begin(async (sql) => {
      console.log('Adding state, country, phone columns to leads...');
      await sql`alter table leads add column if not exists state text`;
      await sql`alter table leads add column if not exists country text`;
      await sql`alter table leads add column if not exists phone text`;
    });
    console.log('Migrations successful!');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

main();
