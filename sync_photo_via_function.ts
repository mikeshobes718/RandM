import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import { getPlaceDetails } from './src/lib/googlePlaces';
import dotenv from 'dotenv';
dotenv.config();

async function syncPhotoViaFunction() {
  const email = 'volurer295@ovbest.com';
  const supa = getSupabaseAdmin();
  
  console.log('Fetching user and business...');
  const { data: user } = await supa.from('users').select('uid').eq('email', email).maybeSingle();
  if (!user) { console.log('❌ User not found'); return; }
  
  const { data: biz } = await supa.from('businesses').select('id,google_place_id').eq('owner_uid', user.uid).maybeSingle();
  if (!biz || !biz.google_place_id) { console.log('❌ Business or Place ID not found'); return; }
  
  console.log('Fetching photo from Google...');
  const details = await getPlaceDetails(biz.google_place_id);
  
  if (!details.photoUrl) {
    console.log('❌ No photo URL from Google');
    return;
  }
  
  console.log(`✅ Photo URL: ${details.photoUrl}`);
  
  // Try using RPC to update via a database function
  // First, let's try a direct update using the REST API with the column name
  // If that fails, we'll need to wait for schema refresh
  
  console.log('\nAttempting update via Supabase REST API...');
  const { error } = await supa
    .from('businesses')
    .update({ 
      google_photo_url: details.photoUrl,
      address: details.formattedAddress || undefined
    })
    .eq('id', biz.id);
  
  if (error) {
    if (error.code === 'PGRST204') {
      console.log('\n⚠️  Schema cache not refreshed yet.');
      console.log('📋 Options:');
      console.log('   1. Wait 5-10 more minutes for auto-refresh');
      console.log('   2. Manually refresh in Supabase Dashboard:');
      console.log('      Settings > API > (scroll down) > Reload Schema');
      console.log('   3. Wait for next Vercel deployment (~40 min)');
      console.log('\n💡 The photo URL is ready:');
      console.log(`   ${details.photoUrl}`);
      console.log('\n   Once schema refreshes, run this script again!');
    } else {
      console.error('❌ Update error:', error);
    }
  } else {
    console.log('✅ Successfully updated! Photo should appear on dashboard now!');
  }
}

syncPhotoViaFunction().catch(console.error);



