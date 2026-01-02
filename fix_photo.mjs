import { getSupabaseAdmin } from './src/lib/supabaseAdmin.ts';
import { getPlaceDetails } from './src/lib/googlePlaces.ts';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  const supa = getSupabaseAdmin();
  const email = 'volurer295@ovbest.com';
  
  console.log('Fetching user...');
  const { data: user } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
  if (!user) { console.log('User not found'); return; }
  
  console.log('Fetching business for UID:', user.uid);
  const { data: biz } = await supa.from('businesses').select('*').eq('owner_uid', user.uid).maybeSingle();
  if (!biz) { console.log('Business not found'); return; }
  
  console.log('Business found:', biz.name, 'Place ID:', biz.google_place_id);
  
  if (biz.google_place_id) {
    console.log('Fetching fresh details from Google...');
    try {
      const details = await getPlaceDetails(biz.google_place_id);
      console.log('Photo URL fetched:', details.photoUrl);
      
      const update = {
        google_photo_url: details.photoUrl || biz.google_photo_url,
        address: details.formattedAddress || biz.address,
        google_rating: details.rating || biz.google_rating
      };
      
      console.log('Updating database...');
      const { error } = await supa.from('businesses').update(update).eq('id', biz.id);
      if (error) console.error('Update error:', error);
      else console.log('Successfully updated business data in Supabase!');
    } catch (e) {
      console.error('Google fetch error:', e);
    }
  }
}
fix();
