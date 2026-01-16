import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  const sql = postgres({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    username: 'postgres.rhnxzpbhoqbvoqyqmfox',
    password,
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10,
    prepare: false, // Poolers usually require this
  });

  try {
    const res = await sql`SELECT version();`;
    console.log('Success!', res);
  } catch (err) {
    console.error('Failed!', err);
  } finally {
    await sql.end();
  }
}

test();
