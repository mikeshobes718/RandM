import dotenv from 'dotenv';
dotenv.config();

async function simpleUpdate() {
  const USER_EMAIL = 'volurer295@ovbest.com';
  
  // Photo URL and address we know from previous attempts
  const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=AZLasHq5xAmkYz4KXwKovhvFzXawGrhrL6bUXh20Gn9uzZqzRSlujJmIxV3_A-lZ8b0uAur-rW5AWdQZiHzk03noKtG-iORYkgMXapcMAgHd-B4ikGsqSiWJX2fozkHaPk5M28y8DP-4c1V5ieBS4oW95rS6TNjc8SIxVXedgFWjqoigCeBe7QH6gy2Lbik-2RFilpcqA0zcc34oHMrFZP8c6aHCKK5VO6v3zt7_q1p_A8nfEvXG70eyyahd4l7kWrK3BF_hYu_Az8fPqVMHNG1zIY7cCQ3NIM5-j4F_nnt6x1U&key=AIzaSyDKxmw2MgQHVrNReNvyBOPwQefyElqf0vc';
  const ADDRESS = 'Cl. 49B #66-32, Laureles - Estadio, Medellín, Laureles, Medellín, Antioquia, Colombia';
  
  const { getSupabaseAdmin } = await import('./src/lib/supabaseAdmin');
  const supa = getSupabaseAdmin();
  
  console.log('1. Getting user UID...');
  const { data: user } = await supa
    .from('users')
    .select('uid')
    .eq('email', USER_EMAIL)
    .single();
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  console.log('2. Getting business ID...');
  const { data: business } = await supa
    .from('businesses')
    .select('id, name')
    .eq('owner_uid', user.uid)
    .single();
  
  if (!business) {
    console.error('Business not found');
    return;
  }
  
  console.log(`3. Updating "${business.name}" with photo and address...`);
  
  // Try updating without selecting the columns first (bypass schema cache)
  const { error } = await supa
    .from('businesses')
    .update({
      google_photo_url: PHOTO_URL,
      address: ADDRESS
    })
    .eq('id', business.id);
  
  if (error) {
    console.error('❌ Update failed:', error.message);
    console.log('\n   This likely means PostgREST schema cache hasn\'t refreshed yet.');
    console.log('   We\'ll need to wait 5-10 more minutes, or refresh it manually in Supabase dashboard.');
  } else {
    console.log('✅ Update successful!');
    console.log('   Photo:', PHOTO_URL.substring(0, 80) + '...');
    console.log('   Address:', ADDRESS);
    console.log('\n🎉 Refresh the dashboard at: https://www.reviewsandmarketing.com/dashboard');
  }
}

simpleUpdate();



