import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('businesses').select('*').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Columns found:', Object.keys(data[0] || {}));
  }
}
check();

