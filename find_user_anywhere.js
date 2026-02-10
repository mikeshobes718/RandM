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
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const emailToFind = 'volurer295@ovbest.com';
  console.log('Searching for:', emailToFind);

  // 1. Search in users table
  const { data: users } = await supabase.from('users').select('*').ilike('email', `%${emailToFind}%`);
  console.log('Users found:', users);

  // 2. Search in businesses table (maybe email is in notes or something)
  const { data: businesses } = await supabase.from('businesses').select('*');
  const bizWithEmail = businesses?.filter(b => JSON.stringify(b).includes(emailToFind));
  console.log('Businesses with email in JSON:', bizWithEmail?.length || 0);

  // 3. Search in subscriptions table
  const { data: subs } = await supabase.from('subscriptions').select('*');
  console.log('Total subscriptions:', subs?.length || 0);

  if (users && users.length > 0) {
    for (const user of users) {
      const userSubs = subs?.filter(s => s.uid === user.uid);
      console.log(`User ${user.email} (${user.uid}) has ${userSubs?.length || 0} subscriptions.`);
      if (userSubs) console.log('Subs:', userSubs);
      
      const userBiz = businesses?.filter(b => b.owner_uid === user.uid);
      console.log(`User ${user.email} (${user.uid}) has ${userBiz?.length || 0} businesses.`);
      if (userBiz) console.log('Biz:', userBiz);
    }
  }
}

// Since fetch fails in this environment, I'll try to use the direct SQL if I can get it to work.
// But wait, I'll try to use the `psql` command again with the password I found.
run();
