import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const supa = getSupabaseAdmin();
  const { data: users } = await supa.from('users').select('uid, email, role');
  const { data: subs } = await supa.from('subscriptions').select('uid, plan_id, status');
  const { data: biz } = await supa.from('businesses').select('owner_uid, name');

  console.log('--- USERS ---');
  console.table(users);
  console.log('--- SUBSCRIPTIONS ---');
  console.table(subs);
  console.log('--- BUSINESSES ---');
  console.table(biz);
  process.exit(0);
}
main();
