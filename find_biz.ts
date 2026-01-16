import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supa = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data, error } = await supa.from('businesses').select('id, name, review_link, google_maps_write_review_uri').ilike('name', '%Smart Fit%');
  console.log('Businesses:', data);
}

check().catch(console.error);
