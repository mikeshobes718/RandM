import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function check() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('leads').select('id').limit(1);
  console.log('Leads table exists?', !error, error?.message);
}

check();
