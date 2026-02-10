const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env loader
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('uid, email')
    .eq('email', email)
    .maybeSingle();

  if (userErr) {
    console.error('Error finding user:', userErr);
    return;
  }

  if (!user) {
    console.log('User not found in "users" table:', email);
    return;
  }

  console.log('Found User:', JSON.stringify(user, null, 2));

  const { data: subs, error: subErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('uid', user.uid);

  if (subErr) {
    console.error('Error fetching subscriptions:', subErr);
  } else {
    console.log('Subscriptions:', JSON.stringify(subs, null, 2));
  }

  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_uid', user.uid);

  if (bizErr) {
    console.error('Error fetching businesses:', bizErr);
  } else {
    console.log('Businesses:', JSON.stringify(biz, null, 2));
  }
}

checkUser('volurer295@ovbest.com');
