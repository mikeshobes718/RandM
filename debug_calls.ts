import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supa = getSupabaseAdmin();
  const { data: reps } = await supa.from('reps').select('*').limit(5);
  const { data: calls } = await supa.from('call_log').select('*').limit(5);

  console.log('--- REPS ---');
  console.table(reps);
  console.log('--- CALL LOGS ---');
  console.table(calls);
  process.exit(0);
}
main();
