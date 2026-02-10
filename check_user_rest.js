const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0) {
          let value = val.join('=').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value;
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  try {
    console.log('Checking for email:', email);
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('uid, email')
      .eq('email', email)
      .maybeSingle();

    if (userErr) {
      console.error('User fetch error:', userErr);
      return;
    }

    if (!user) {
      console.log('No user found with that email.');
      return;
    }

    console.log('User found:', user);

    const { data: subs, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('uid', user.uid);

    console.log('Subscriptions:', subs || [], subErr || '');

    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_uid', user.uid);

    console.log('Businesses:', biz || [], bizErr || '');
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

checkUser('volurer295@ovbest.com');
