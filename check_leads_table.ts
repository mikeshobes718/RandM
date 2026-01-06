import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const supa = getSupabaseAdmin();
  console.log('Checking leads table...');
  const { data, error } = await supa.from('leads').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('Error checking leads table:', error);
  } else {
    console.log('Leads table exists. Count:', data);
  }
}

main();

