import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function list() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('users').select('*').limit(1);
  console.log('Users check:', !!data, error?.message);
  
  // Try to query information_schema
  const { data: tables, error: tablesError } = await supa.rpc('get_tables'); // If RPC exists
  if (tablesError) {
    // Fallback: try to select from a table that might exist
    const { error: repsError } = await supa.from('reps').select('id').limit(1);
    console.log('Reps table exists?', !repsError, repsError?.message);
    const { error: logError } = await supa.from('call_log').select('id').limit(1);
    console.log('Call_log table exists?', !logError, logError?.message);
  } else {
    console.log('Tables:', tables);
  }
}

list();
