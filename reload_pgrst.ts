import { getPgPool } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function reloadPgrst() {
  const pool = getPgPool();
  if (!pool) {
    console.error('❌ PG Pool not configured.');
    return;
  }
  const client = await pool.connect();

  try {
    console.log('Sending NOTIFY pgrst, "reload schema"...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✅ Signal sent successfully!');
    
    console.log('\nWaiting 5 seconds for reload...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Retrying photo sync...');
    const { execSync } = require('child_process');
    execSync('npx tsx sync_photo_now.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
  }
}

reloadPgrst();
