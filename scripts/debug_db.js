const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT),
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Checking tables...');
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    
    if (tables.rows.some(r => r.table_name === 'review_sources')) {
      const sources = await pool.query("SELECT * FROM review_sources");
      console.log('Review Sources count:', sources.rowCount);
      console.log('Review Sources:', JSON.stringify(sources.rows, null, 2));
    } else {
      console.log('review_sources table does NOT exist!');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
run();
