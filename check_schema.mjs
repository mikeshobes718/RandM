import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('square_backfill_jobs').select('*').limit(1);
  if (error) {
    console.log('square_backfill_jobs missing, creating it...');
    // Create it if missing? No, I'll just check if it exists.
    console.error(error);
  } else {
    console.log('square_backfill_jobs exists');
  }
}

run();
