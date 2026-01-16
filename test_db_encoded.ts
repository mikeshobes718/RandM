import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test() {
  const user = process.env.SUPABASE_DB_USER;
  const pass = process.env.SUPABASE_DB_PASSWORD;
  const host = process.env.SUPABASE_DB_HOST;
  const port = process.env.SUPABASE_DB_PORT;
  const db = process.env.SUPABASE_DB_NAME;
  
  const connectionString = `postgres://${user}:${encodeURIComponent(pass!)}@${host}:${port}/${db}?sslmode=require`;
  console.log('Connecting to:', host);
  
  const sql = postgres(connectionString);
  
  try {
    const result = await sql`select now()`;
    console.log('Success:', result);
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await sql.end();
  }
}

test().catch(console.error);
