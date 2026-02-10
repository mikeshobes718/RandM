import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function checkUser(email: string) {
  const supabase = getSupabaseAdmin();
  
  // 1. Find user by email
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('uid, email')
    .eq('email', email)
    .single();

  if (userErr || !user) {
    console.log('User not found in database:', email);
    return;
  }

  console.log('Found User:', user);

  // 2. Check subscription status
  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('uid', user.uid)
    .order('updated_at', { ascending: false });

  if (subErr) {
    console.error('Error fetching subscriptions:', subErr);
  } else {
    console.log('Subscriptions:', sub);
  }

  // 3. Check business status
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_uid', user.uid);

  if (bizErr) {
    console.error('Error fetching businesses:', bizErr);
  } else {
    console.log('Businesses:', biz);
  }
}

checkUser('volurer295@ovbest.com');
