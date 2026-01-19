const { getSql } = require('../src/lib/supabaseAdmin');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const sql = getSql();
  if (!sql) {
    console.error('No SQL client');
    return;
  }
  try {
    const res = await sql`SELECT * FROM review_sources LIMIT 10`;
    console.log('Sources:', JSON.stringify(res, null, 2));
    
    const count = await sql`SELECT count(*) FROM review_sources`;
    console.log('Total count:', count[0].count);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit();
  }
}
check();
