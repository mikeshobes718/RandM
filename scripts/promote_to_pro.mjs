import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhnxzpbhoqbvoqyqmfox.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobnh6cGJob3Fidm9xeXFtZm94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwOTUyNywiZXhwIjoyMDY1OTg1NTI3fQ.DAEIckAdzRBZIdUtsvn411VRAlPoh3uF-qTb_UgvM9c';
const EMAIL = process.argv[2] || 'volurer295@ovbest.com';

async function run() {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const userRes = await client.from('users').select('uid').eq('email', EMAIL).maybeSingle();
  if (userRes.error) throw userRes.error;
  let uid = userRes.data?.uid;

  if (!uid) {
    console.log('No user row for email; inserting minimal user record.');
    const insert = await client.from('users').insert({ uid: crypto.randomUUID(), email: EMAIL }).select('uid').maybeSingle();
    if (insert.error) throw insert.error;
    uid = insert.data.uid;
  }

  console.log('Using uid:', uid);

  const subscriptions = await client
    .from('subscriptions')
    .upsert({
      uid,
      status: 'active',
      plan_id: 'pro_manual',
      stripe_subscription_id: `manual_${Date.now()}`,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'uid' })
    .select('*');
  if (subscriptions.error) throw subscriptions.error;
  console.log('Upserted subscription rows:', subscriptions.data);

  await client.from('stripe_customers').upsert({ uid, stripe_customer_id: `manual_${uid}` });

  console.log('Promotion complete.');
}

run().catch((err) => {
  console.error('Failed to promote user:', err);
  process.exit(1);
});
