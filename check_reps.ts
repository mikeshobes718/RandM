const { getSupabaseAdmin } = require('./src/lib/supabaseAdmin');

async function check() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('reps').select('*');
  console.log('Reps:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

check();
