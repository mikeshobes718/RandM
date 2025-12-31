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
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'feedback' });
  if (error) {
    // Fallback: try to select one row and see keys
    const { data: rows } = await supabase.from('feedback').select('*').limit(1);
    console.log('Columns in feedback table:', Object.keys(rows[0] || {}));
  } else {
    console.log('Schema:', data);
  }
}

run();
