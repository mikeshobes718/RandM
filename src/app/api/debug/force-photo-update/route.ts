import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) return new NextResponse('Missing email', { status: 400 });
  
  // Construct direct Postgres connection using Supabase project details
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  
  // We'll use the service role key to construct a connection string
  // For Supabase, the direct connection is via pooler
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // First, get the user's UID
    const userResult = await pool.query(
      'SELECT uid FROM public.users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' });
    }
    
    const uid = userResult.rows[0].uid;
    
    // Get the business
    const bizResult = await pool.query(
      'SELECT id, name, google_place_id FROM public.businesses WHERE owner_uid = $1',
      [uid]
    );
    
    if (bizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' });
    }
    
    const business = bizResult.rows[0];
    
    if (!business.google_place_id) {
      return NextResponse.json({ error: 'No Google Place ID' });
    }
    
    // Fetch fresh data from Google
    const { getPlaceDetails } = await import('@/lib/googlePlaces');
    const details = await getPlaceDetails(business.google_place_id);
    
    if (!details.photoUrl) {
      return NextResponse.json({ error: 'No photo URL from Google' });
    }
    
    // Direct SQL update
    const updateResult = await pool.query(
      'UPDATE public.businesses SET google_photo_url = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING google_photo_url, address',
      [details.photoUrl, details.formattedAddress, business.id]
    );
    
    await pool.end();
    
    return NextResponse.json({
      success: true,
      business: business.name,
      photoUrl: updateResult.rows[0].google_photo_url,
      address: updateResult.rows[0].address,
      message: 'Photo and address updated via direct SQL'
    });
    
  } catch (e: any) {
    await pool.end();
    console.error('[FORCE PHOTO UPDATE] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


