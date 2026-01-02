import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function notifyReload() {
  const supa = getSupabaseAdmin();
  console.log('Sending NOTIFY pgrst, "reload schema"...');
  
  try {
    const { error } = await supa.rpc('execute_sql', { 
      sql: "NOTIFY pgrst, 'reload schema';" 
    });
    
    if (error) {
      console.log('Error sending notify:', error.message);
      console.log('Trying direct query...');
      // Fallback: Use the pg library directly if rpc fails
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await pool.query("NOTIFY pgrst, 'reload schema';");
      await pool.end();
      console.log('✅ NOTIFY sent via direct connection');
    } else {
      console.log('✅ NOTIFY sent successfully via RPC');
    }
    
    console.log('\nWaiting 5 seconds for cache to refresh...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Retry sync
    const { execSync } = require('child_process');
    execSync('npx tsx sync_photo_now.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

notifyReload();
