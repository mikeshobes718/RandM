import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.from('businesses').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

main();

