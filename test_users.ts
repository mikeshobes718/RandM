import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error querying users:', error);
  } else {
    console.log('Successfully queried users:', data);
  }
}

main();
