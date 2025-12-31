import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const rawEnv = fs.readFileSync(envPath, 'utf8');
const env = {};

// Handle both real newlines and escaped \n
const lines = rawEnv.split(/\\n|\n/).filter(line => line && !line.startsWith('#'));
lines.forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const bizId = '00d2bb2e-dcc9-4774-862f-e7713288863b';
  
  console.log('Checking Business ID:', bizId);
  console.log('--- LATEST 10 REVIEW EVENTS ---');
  const { data: events } = await supabase
    .from('review_events')
    .select('*')
    .eq('business_id', bizId)
    .order('created_at', { ascending: false })
    .limit(10);
  events?.forEach(e => console.log(`[EVENT] ${e.event} | ${e.created_at} | ID: ${e.id}`));

  console.log('\n--- LATEST 10 FEEDBACK ENTRIES ---');
  const { data: feedback } = await supabase
    .from('feedback')
    .select('*')
    .eq('business_id', bizId)
    .order('created_at', { ascending: false })
    .limit(10);
  feedback?.forEach(f => console.log(`[FEEDBACK] ${f.name} | ${f.rating}★ | ${f.created_at} | ID: ${f.id} | Comment: ${f.comment}`));

  console.log('\n--- LATEST 10 CONTACT CAPTURES ---');
  const { data: contacts } = await supabase
    .from('review_contact_captures')
    .select('*')
    .eq('business_id', bizId)
    .order('created_at', { ascending: false })
    .limit(10);
  contacts?.forEach(c => console.log(`[CONTACT] ${c.name} | ${c.created_at} | ID: ${c.id}`));
}

run();
