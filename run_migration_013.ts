import { getSupabaseAdmin } from './src/lib/supabaseAdmin';
import dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  console.log('Running migration 013: Add google_photo_url column...');
  
  // Use Supabase REST API to execute SQL via RPC
  // Since we can't run raw SQL directly, we'll use the Supabase client
  // to check if column exists and add it if needed
  
  const supa = getSupabaseAdmin();
  
  // Try to query the column - if it fails, the column doesn't exist
  try {
    const testQuery = await supa
      .from('businesses')
      .select('google_photo_url')
      .limit(1);
    
    console.log('✅ Column google_photo_url already exists!');
    return;
  } catch (error: any) {
    if (error.message?.includes('google_photo_url')) {
      console.log('❌ Column does not exist. Need to add it via SQL editor.');
      console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
      console.log('\nALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_photo_url text;');
      console.log('\nOr visit: https://supabase.com/dashboard/project/rhnxzpbhoqbvoqyqmfox/sql/new');
      return;
    }
    throw error;
  }
}

runMigration().catch(console.error);




