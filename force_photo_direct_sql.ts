import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function forceUpdate() {
  const USER_EMAIL = 'volurer295@ovbest.com';
  const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=AZLasHq5xAmkYz4KXwKovhvFzXawGrhrL6bUXh20Gn9uzZqzRSlujJmIxV3_A-lZ8b0uAur-rW5AWdQZiHzk03noKtG-iORYkgMXapcMAgHd-B4ikGsqSiWJX2fozkHaPk5M28y8DP-4c1V5ieBS4oW95rS6TNjc8SIxVXedgFWjqoigCeBe7QH6gy2Lbik-2RFilpcqA0zcc34oHMrFZP8c6aHCKK5VO6v3zt7_q1p_A8nfEvXG70eyyahd4l7kWrK3BF_hYu_Az8fPqVMHNG1zIY7cCQ3NIM5-j4F_nnt6x1U&key=AIzaSyDKxmw2MgQHVrNReNvyBOPwQefyElqf0vc';
  const ADDRESS = 'Cl. 49B #66-32, Laureles - Estadio, Medellín, Laureles, Medellín, Antioquia, Colombia';
  
  // Get direct connection string from Supabase
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  
  // Use connection pooler with service role key as password
  // Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('1. Getting user UID...');
    const userResult = await pool.query('SELECT uid FROM public.users WHERE email = $1', [USER_EMAIL]);
    if (userResult.rows.length === 0) {
      console.error('User not found');
      return;
    }
    const uid = userResult.rows[0].uid;
    
    console.log('2. Updating business photo and address...');
    const result = await pool.query(
      `UPDATE public.businesses 
       SET google_photo_url = $1, address = $2, updated_at = NOW() 
       WHERE owner_uid = $3 
       RETURNING id, name, google_photo_url, address`,
      [PHOTO_URL, ADDRESS, uid]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ SUCCESS! Updated:', result.rows[0].name);
      console.log('   Photo URL:', result.rows[0].google_photo_url?.substring(0, 80) + '...');
      console.log('   Address:', result.rows[0].address);
    } else {
      console.log('No business found for this user');
    }
    
    await pool.end();
  } catch (e: any) {
    await pool.end();
    console.error('❌ Error:', e.message);
  }
}

forceUpdate();
