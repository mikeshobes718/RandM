import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supa = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function count() {
  const { data, error } = await supa.from('leads').select('id');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total leads in DB:', data?.length);
  }
}

count().catch(console.error);
