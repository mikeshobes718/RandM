import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const uid = 'volurer295@ovbest.com'; // This is the user's email, not UID. I should find the UID first.
  const { data: userData } = await supabase.from('users').select('uid').eq('email', 'volurer295@ovbest.com').maybeSingle();
  const actualUid = userData?.uid || 'no-user-found';
  console.log('UID:', actualUid);

  const { data: biz } = await supabase.from('businesses').select('id, name').eq('owner_uid', actualUid);
  console.log('Businesses:', biz);

  if (biz && biz.length > 0) {
    const ids = biz.map(b => b.id);
    const { count: eventCount } = await supabase.from('review_events').select('*', { count: 'exact', head: true }).in('business_id', ids);
    console.log('Total events:', eventCount);

    const { data: events } = await supabase.from('review_events').select('*').in('business_id', ids).limit(5);
    console.log('Sample events:', events);
    
    const { data: feedback } = await supabase.from('feedback').select('*').in('business_id', ids);
    console.log('Total feedback records:', feedback?.length);
  }
}

run();
