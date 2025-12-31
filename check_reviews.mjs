import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getPlaceReviews(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const mask = 'reviews';
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': mask,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Google API Error:', text);
    return [];
  }
  const data = await res.json();
  return data.reviews || [];
}

async function run() {
  const { data: biz } = await supabase.from('businesses').select('id, name, google_place_id').eq('name', 'Small Branch Place').maybeSingle();
  console.log('Business:', biz);

  if (biz?.google_place_id) {
    const reviews = await getPlaceReviews(biz.google_place_id);
    console.log('Total Google Reviews found:', reviews.length);
    if (reviews.length > 0) {
      console.log('First review author:', reviews[0].authorAttribution?.displayName);
    }
  }
}

run();
