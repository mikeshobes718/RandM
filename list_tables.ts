import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supa = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data, error } = await supa.rpc('get_tables'); // This might not work if RPC doesn't exist
  if (error) {
     const { data: d2, error: e2 } = await supa.from('users').select('uid').limit(1);
     console.log('Users table exists?', !e2);
     const { data: d3, error: e3 } = await supa.from('leads').select('id').limit(1);
     console.log('Leads table exists?', !e3, e3?.message);
  } else {
    console.log('Tables:', data);
  }
}

check().catch(console.error);
