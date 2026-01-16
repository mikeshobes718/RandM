import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test() {
  const pool = new Pool({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres', // Direct username
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    const result = await client.query('select now()');
    console.log('Success:', result.rows);
    client.release();
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await pool.end();
  }
}

test().catch(console.error);
