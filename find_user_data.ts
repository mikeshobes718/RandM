import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function check() {
  const supa = getSupabaseAdmin();
  
  // 1. Find the user UID
  const { data: user, error: userError } = await supa
    .from('users')
    .select('uid, email')
    .eq('email', 'volurer295@ovbest.com')
    .maybeSingle();
    
  if (userError) {
    console.error('User search error:', userError);
    return;
  }
  
  if (!user) {
    console.log('User not found in "users" table.');
    return;
  }
  
  console.log('Found user:', user.email, 'UID:', user.uid);
  
  // 2. Find the business for this UID
  const { data: biz, error: bizError } = await supa
    .from('businesses')
    .select('*')
    .eq('owner_uid', user.uid)
    .maybeSingle();
    
  if (bizError) {
    console.error('Business search error:', bizError);
    return;
  }
  
  if (!biz) {
    console.log('No business found for this user.');
    return;
  }
  
  console.log('Business Data:');
  console.log('Name:', biz.name);
  console.log('Google Place ID:', biz.google_place_id);
  console.log('Google Rating:', biz.google_rating);
  console.log('Review Link:', biz.review_link);
}

check();
