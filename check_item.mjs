import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const rawEnv = fs.readFileSync(envPath, 'utf8');
const env = {};
const lines = rawEnv.split(/\\n|\n/).filter(line => line && !line.startsWith('#'));
lines.forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: item } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', '865edf12-916f-4cc4-a141-99843d43e856')
    .single();
  
  console.log('Item:', item);
}

run();
