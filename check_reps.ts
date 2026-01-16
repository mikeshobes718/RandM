import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function check() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('reps').select('*');
  if (error) {
    console.error('Error fetching reps:', error);
    return;
  }
  console.log('Reps in database:', data);
}

check();
