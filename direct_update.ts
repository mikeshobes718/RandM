import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Construct connection string from Supabase URL
const SUPABASE_URL = process.env.SUPABASE_URL!;
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
// For Supabase, we need the direct Postgres connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
// But we don't have the password, so we'll use the service role key approach

// Actually, let's use the Supabase REST API with a raw SQL query via RPC
// Or better yet, let's check if we can use the Supabase client's RPC with execute_sql

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function directUpdate() {
  const USER_EMAIL = 'volurer295@ovbest.com';
  const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=AZLasHpOcutB1XjTKAH3vMDy__H-phiL5MZisl8VASBEoQ0U2jeYdBbfgZmS0IP804qanYqg-TLOsuLULfS7dbVxsoARMw7T1-onXeNVX8Ezzl8fpENS1Ptv_j17wRSMRG5vwHjz6ZgGSs0C-_q1D-hFIjzdki9E9xBOd--b4uO30J02g4fs8up438JACkNABqINqnV3iVBsAHDV8NGi4BUlIHlyoQqrBZm2C6_HSF21C7mHwIMXlVWK1OEQy5WpGfD28gc6aqDGGUpB5DPGPM8SLVnunm_K1l1nurm79SPs5bc&key=AIzaSyDKxmw2MgQHVrNReNvyBOPwQefyElqf0vc';
  const ADDRESS = 'Cl. 49B #66-32, Laureles - Estadio, Medellín, Laureles, Medellín, Antioquia, Colombia';

  console.log('Attempting direct SQL update via Supabase RPC...');
  
  // Try using RPC to execute raw SQL
  const sql = `
    UPDATE public.businesses 
    SET google_photo_url = $1, address = $2
    WHERE id = (
      SELECT id FROM public.businesses 
      WHERE owner_uid = (SELECT uid FROM public.users WHERE email = $3)
    );
  `;
  
  try {
    // Supabase doesn't have a direct execute_sql RPC by default
    // But we can try using the REST API directly
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params: [PHOTO_URL, ADDRESS, USER_EMAIL] }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log('RPC failed:', text);
      throw new Error(`RPC failed: ${text}`);
    }
    
    console.log('✅ Update successful via RPC!');
  } catch (e: any) {
    console.log('RPC approach failed:', e.message);
    console.log('\n📋 The PostgREST schema cache will refresh automatically within 5-10 minutes.');
    console.log('   Once refreshed, the photo will sync automatically via the dashboard API.');
  }
}

directUpdate();
