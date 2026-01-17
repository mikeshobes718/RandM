import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function debugCustomers() {
  const supa = getSupabaseAdmin();
  
  console.log('=== CHECKING SUBSCRIPTIONS ===');
  const { data: allSubs, error: subsError } = await supa
    .from('subscriptions')
    .select('*');
  
  console.log('Total subscriptions:', allSubs?.length);
  console.log('Subscriptions:', JSON.stringify(allSubs, null, 2));
  
  if (allSubs && allSubs.length > 0) {
    const uids = allSubs.map(s => s.uid).filter(Boolean);
    console.log('\n=== CHECKING USERS FOR THESE UIDS ===');
    const { data: users } = await supa
      .from('users')
      .select('uid, email, role')
      .in('uid', uids);
    console.log('Users found:', JSON.stringify(users, null, 2));
    
    console.log('\n=== CHECKING BUSINESSES ===');
    const { data: businesses } = await supa
      .from('businesses')
      .select('id, name, owner_uid')
      .in('owner_uid', uids);
    console.log('Businesses found:', JSON.stringify(businesses, null, 2));
  }
}

debugCustomers().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
