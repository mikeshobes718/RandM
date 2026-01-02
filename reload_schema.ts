import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to reload PostgREST schema via REST API
async function reloadSchema() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  // PostgREST schema reload endpoint (if available)
  const url = `${SUPABASE_URL}/rest/v1/_reload`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      console.log('✅ Schema reloaded successfully!');
    } else {
      console.log('⚠️  Direct reload not available. Trying alternative...');
    }
  } catch (e: any) {
    console.log('⚠️  API reload not available:', e.message);
    console.log('\n📋 Alternative: The schema will auto-refresh within 5-10 minutes.');
    console.log('   Or manually refresh in Supabase Dashboard > Settings > API');
  }
}

reloadSchema();
