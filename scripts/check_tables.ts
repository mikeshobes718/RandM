import { getPgPool } from '../src/lib/supabaseAdmin';

async function run() {
  const pool = getPgPool();
  if (!pool) return;
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', res.rows.map((r: any) => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
