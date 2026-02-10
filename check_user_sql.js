const postgres = require('postgres');
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

const password = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com';
const port = Number(process.env.SUPABASE_DB_PORT) || 6543;
const user = process.env.SUPABASE_DB_USER || 'postgres.rhnxzpbhoqbvoqyqmfox';
const database = process.env.SUPABASE_DB_NAME || 'postgres';

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const sql = postgres({
  host,
  port,
  database,
  username: user,
  password,
  ssl: 'require',
  prepare: false,
});

async function checkUser(email) {
  try {
    console.log('Checking for email:', email);
    const users = await sql`SELECT uid, email FROM users WHERE email = ${email}`;
    console.log('Users found:', JSON.stringify(users, null, 2));

    if (users.length > 0) {
      const uid = users[0].uid;
      const subs = await sql`SELECT * FROM subscriptions WHERE uid = ${uid}`;
      console.log('Subscriptions found:', JSON.stringify(subs, null, 2));

      const biz = await sql`SELECT * FROM businesses WHERE owner_uid = ${uid}`;
      console.log('Businesses found:', JSON.stringify(biz, null, 2));
    } else {
      console.log('No user found with that email in "users" table.');
      // Check if the email exists in subscriptions or businesses directly by some other field if possible
      // But usually they are linked by UID.
    }
  } catch (err) {
    console.error('SQL Error:', err);
  } finally {
    await sql.end();
  }
}

checkUser('volurer295@ovbest.com');
