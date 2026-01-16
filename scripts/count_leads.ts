import { getPgPool } from '../src/lib/supabaseAdmin';

async function run() {
  const pool = getPgPool();
  if (!pool) {
    console.error('No DB pool');
    return;
  }

  try {
    const { rows } = await pool.query('SELECT count(*) FROM leads');
    console.log(`TOTAL_LEADS:${rows[0].count}`);
  } catch (err) {
    console.error('❌ Failed to count leads:', err);
  } finally {
    await pool.end();
  }
}

run();
