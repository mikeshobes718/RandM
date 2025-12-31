import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get the business
  const { data: biz } = await supabase
    .from('businesses')
    .select('id, name, owner_uid')
    .eq('name', 'Small Branch Place')
    .maybeSingle();
  
  if (!biz) {
    console.log('Business not found');
    return;
  }
  
  console.log('Business:', biz.name, '(ID:', biz.id + ')');
  console.log('');
  
  // Count feedback entries
  const { data: feedback, count: feedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact' })
    .eq('business_id', biz.id);
  
  console.log('📝 Private Feedback (1-4 stars):', feedbackCount);
  if (feedback && feedback.length > 0) {
    feedback.forEach(f => {
      console.log(`  - ${f.rating}★ from ${f.name || 'Anonymous'} on ${new Date(f.created_at).toLocaleDateString()}`);
    });
  }
  console.log('');
  
  // Count contact captures
  const { data: contacts, count: contactCount } = await supabase
    .from('review_contact_captures')
    .select('*', { count: 'exact' })
    .eq('business_id', biz.id);
  
  console.log('⭐ 5-Star Contact Captures:', contactCount);
  if (contacts && contacts.length > 0) {
    contacts.forEach(c => {
      console.log(`  - ${c.name || 'Anonymous'} on ${new Date(c.created_at).toLocaleDateString()}`);
    });
  }
  console.log('');
  
  // Count review events
  const { data: events, count: eventCount } = await supabase
    .from('review_events')
    .select('*', { count: 'exact' })
    .eq('business_id', biz.id);
  
  console.log('🔔 Review Events:', eventCount);
  if (events && events.length > 0) {
    const eventsByType = events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(eventsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }
  console.log('');
  
  console.log('📊 TOTAL ENTRIES THAT SHOULD SHOW:');
  console.log(`  - Private Feedback: ${feedbackCount || 0}`);
  console.log(`  - 5-Star Contacts: ${contactCount || 0}`);
  console.log(`  - Google Reviews: (fetched via API, not in DB)`);
  console.log(`  - TOTAL: ${(feedbackCount || 0) + (contactCount || 0)} + Google reviews`);
}

run();
