import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function forceUpdatePhoto() {
  const USER_EMAIL = 'volurer295@ovbest.com';
  
  // Get Google photo
  const { getPlaceDetails } = await import('./src/lib/googlePlaces');
  
  // We need to get the user's business place_id first
  const { getSupabaseAdmin } = await import('./src/lib/supabaseAdmin');
  const supa = getSupabaseAdmin();
  
  console.log('1. Fetching user...');
  const { data: user, error: userError } = await supa
    .from('users')
    .select('uid')
    .eq('email', USER_EMAIL)
    .maybeSingle();
  
  if (userError || !user) {
    console.error('User not found:', userError?.message);
    return;
  }
  
  console.log('2. Fetching business...');
  const { data: business, error: bizError } = await supa
    .from('businesses')
    .select('id, name, google_place_id')
    .eq('owner_uid', user.uid)
    .maybeSingle();
  
  if (bizError || !business) {
    console.error('Business not found:', bizError?.message);
    return;
  }
  
  if (!business.google_place_id) {
    console.log('No Google Place ID found.');
    return;
  }
  
  console.log(`3. Fetching fresh Google data for "${business.name}"...`);
  const details = await getPlaceDetails(business.google_place_id);
  
  if (!details.photoUrl) {
    console.log('No photo URL from Google.');
    return;
  }
  
  console.log(`   Photo URL: ${details.photoUrl.substring(0, 80)}...`);
  console.log(`   Address: ${details.formattedAddress}`);
  
  // Now use direct SQL via pg pool
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  
  // Supabase connection pooler format
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('\n4. Updating database with direct SQL...');
    const result = await pool.query(
      `UPDATE public.businesses 
       SET google_photo_url = $1, address = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING google_photo_url, address`,
      [details.photoUrl, details.formattedAddress, business.id]
    );
    
    await pool.end();
    
    if (result.rows.length > 0) {
      console.log('✅ SUCCESS! Photo and address updated:');
      console.log('   Photo URL:', result.rows[0].google_photo_url.substring(0, 80) + '...');
      console.log('   Address:', result.rows[0].address);
      console.log('\n   🎉 Refresh the dashboard to see the photo!');
    }
  } catch (e: any) {
    await pool.end();
    console.error('❌ Database error:', e.message);
    
    // If connection failed, maybe we don't have the DB password
    if (e.message.includes('password') || e.message.includes('authentication')) {
      console.log('\n💡 Tip: You may need to add SUPABASE_DB_PASSWORD to .env');
      console.log('   Get it from: https://supabase.com/dashboard/project/rhnxzpbhoqbvoqyqmfox/settings/database');
    }
  }
}

forceUpdatePhoto();

