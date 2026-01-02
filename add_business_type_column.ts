import { getPgPool } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = getPgPool();
  if (!pool) {
    console.error('❌ PG pool not configured');
    return;
  }
  const client = await pool.connect();
  try {
    console.log('Adding business_type column to businesses table...');
    await client.query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type text;');
    console.log('✅ Success!');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();

