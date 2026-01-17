import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function debug() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('users')
    .select('uid, email, rep_id, role');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Users:', JSON.stringify(data, null, 2));
}

debug();
