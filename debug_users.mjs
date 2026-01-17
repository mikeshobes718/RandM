import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debug() {
  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supa
    .from('users')
    .select('uid, email, rep_id, role');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Users:', JSON.stringify(data, null, 2));
}

debug();
