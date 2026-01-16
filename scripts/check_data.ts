import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supa = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  console.log('--- REPS ---');
  const { data: reps } = await supa.from('reps').select('*');
  console.table(reps || []);

  console.log('\n--- CALL LOGS (last 5) ---');
  const { data: calls } = await supa.from('call_log').select('*, leads(name)').order('timestamp', { ascending: false }).limit(5);
  console.log(JSON.stringify(calls, null, 2));

  console.log('\n--- COMMISSIONS ---');
  const { data: comms } = await supa.from('commissions').select('*');
  console.table(comms || []);
}

main().catch(console.error);
