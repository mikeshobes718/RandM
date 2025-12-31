import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: biz, error } = await supabase
    .from('businesses')
    .select('*')
    .ilike('name', '%Small Branch Place%')
    .maybeSingle();

  if (error) {
    console.error('Error fetching biz:', error);
    return;
  }

  if (!biz) {
    console.log('Business not found');
    return;
  }

  console.log('Found business:', {
    id: biz.id,
    name: biz.name,
    google_place_id: biz.google_place_id,
    review_link: biz.review_link,
    google_maps_write_review_uri: biz.google_maps_write_review_uri
  });

  if (biz.google_place_id && biz.google_place_id.startsWith('Ei')) {
    console.log('Detected Feature ID (Ei...). Attempting to find standard Place ID (ChIJ...)');
    
    // We can't easily call the API from here without the API key, 
    // but we can look at what the upsert form does.
    // Actually, I'll just print instructions if I can't fix it automatically.
  }
}

run();
