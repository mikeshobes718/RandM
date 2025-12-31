import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const bizId = '00d2bb2e-dcc9-4774-862f-e7713288863b';
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  
  console.log('Checking for entries since:', fiveMinutesAgo);

  const { data: feedback } = await supabase
    .from('feedback')
    .select('*')
    .eq('business_id', bizId)
    .gte('created_at', fiveMinutesAgo);
  
  console.log('\n--- NEW PRIVATE FEEDBACK ---');
  console.log(feedback);
  
  const { data: contacts } = await supabase
    .from('review_contact_captures')
    .select('*')
    .eq('business_id', bizId)
    .gte('created_at', fiveMinutesAgo);
    
  console.log('\n--- NEW CONTACT CAPTURES ---');
  console.log(contacts);

  const { data: events } = await supabase
    .from('review_events')
    .select('*')
    .eq('business_id', bizId)
    .gte('created_at', fiveMinutesAgo);
    
  console.log('\n--- NEW REVIEW EVENTS ---');
  console.log(events);
}

run();
