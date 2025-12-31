import pkg from 'pg';
const { Pool } = pkg;
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

const url = new URL(env.SUPABASE_URL);
const host = 'db.' + url.hostname;

const pool = new Pool({
  host: host,
  port: 5432,
  user: 'postgres',
  password: env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding archived column to feedback table...');
    await client.query('ALTER TABLE feedback ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false');
    
    console.log('Adding archived column to review_contact_captures table...');
    await client.query('ALTER TABLE review_contact_captures ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false');
    
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
