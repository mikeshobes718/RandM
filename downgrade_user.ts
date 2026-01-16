import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function downgrade() {
  const email = 'bladespindler@gmail.com';
  
  const { data: user, error: userError } = await supa
    .from('users')
    .select('uid')
    .eq('email', email)
    .single();
    
  if (userError || !user) {
    console.error('User not found:', userError?.message || 'No user data');
    return;
  }
  
  console.log('Found user UID:', user.uid);
  
  const { error: subError } = await supa
    .from('subscriptions')
    .delete()
    .eq('uid', user.uid);
    
  if (subError) {
    console.error('Failed to delete subscription:', subError.message);
    return;
  }
  
  console.log('✅ User bladespindler@gmail.com downgraded to Free.');
}

downgrade().catch(console.error);
