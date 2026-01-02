import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function forceRefresh() {
  const supa = getSupabaseAdmin();
  
  // Try to query the businesses table with all columns
  // This might trigger PostgREST to refresh its schema
  console.log('Making a query to potentially trigger schema refresh...');
  
  try {
    // Query with a column that definitely exists
    const { data, error } = await supa
      .from('businesses')
      .select('id, name, google_place_id')
      .limit(1);
    
    if (error) {
      console.log('Query error:', error.message);
    } else {
      console.log('✅ Query successful');
    }
    
    // Now wait a moment and try the photo sync
    console.log('\nWaiting 3 seconds, then retrying photo sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Import and run the sync
    const { execSync } = require('child_process');
    execSync('npx tsx sync_photo_now.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

forceRefresh();
