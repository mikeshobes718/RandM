import { getPgPool } from '../src/lib/supabaseAdmin';

async function run() {
  const pool = getPgPool();
  if (!pool) {
    console.error('No DB pool');
    return;
  }

  const sql = `
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_by_email text;
    DO $$ 
    BEGIN 
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_notes') THEN
        ALTER TABLE leads RENAME COLUMN lead_notes TO notes;
      END IF;
    END $$;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
  `;

  try {
    console.log('Running schema fix...');
    await pool.query(sql);
    console.log('✅ Schema fixed successfully!');
  } catch (err) {
    console.error('❌ Failed to fix schema:', err);
  } finally {
    await pool.end();
  }
}

run();
