import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import { getPlaceDetails } from './src/lib/googlePlaces';
import dotenv from 'dotenv';
dotenv.config();

async function syncPhoto() {
  const email = 'volurer295@ovbest.com';
  const supa = getSupabaseAdmin();
  
  console.log('Fetching user...');
  const { data: user } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
  if (!user) { console.log('❌ User not found'); return; }
  
  console.log('Fetching business...');
  const { data: biz } = await supa.from('businesses').select('*').eq('owner_uid', user.uid).maybeSingle();
  if (!biz) { console.log('❌ Business not found'); return; }
  
  console.log(`✅ Business found: ${biz.name}`);
  console.log(`   Place ID: ${biz.google_place_id}`);
  console.log(`   Current photo URL: ${biz.google_photo_url || 'NONE'}`);
  
  if (!biz.google_place_id) {
    console.log('❌ No Google Place ID found');
    return;
  }
  
  console.log('\nFetching fresh data from Google Places...');
  try {
    const details = await getPlaceDetails(biz.google_place_id);
    console.log(`✅ Photo URL from Google: ${details.photoUrl || 'NONE'}`);
    console.log(`   Address: ${details.formattedAddress || 'NONE'}`);
    
    const update: any = {};
    if (details.photoUrl && !biz.google_photo_url) {
      update.google_photo_url = details.photoUrl;
      console.log('\n📸 Updating photo URL...');
    }
    if (details.formattedAddress && !biz.address) {
      update.address = details.formattedAddress;
      console.log('📍 Updating address...');
    }
    
    if (Object.keys(update).length > 0) {
      const { error } = await supa.from('businesses').update(update).eq('id', biz.id);
      if (error) {
        console.error('❌ Update error:', error);
      } else {
        console.log('✅ Successfully updated business data!');
        console.log('\n🎉 The photo should now appear on the dashboard!');
      }
    } else {
      console.log('\n✅ All data is already up to date!');
    }
  } catch (e: any) {
    console.error('❌ Error fetching Google data:', e.message);
  }
}

syncPhoto().catch(console.error);




