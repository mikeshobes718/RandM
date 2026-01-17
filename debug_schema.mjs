import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debug() {
  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supa.rpc('get_table_schema', { table_name: 'call_log' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select
    const { data: cols, error: err2 } = await supa.from('call_log').select('*').limit(1);
    console.log('Sample row columns:', Object.keys(cols?.[0] || {}));
    return;
  }
  console.log('Schema:', data);
}

debug();
