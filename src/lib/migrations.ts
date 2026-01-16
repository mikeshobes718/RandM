import { getEnv } from './env';
import { getPgPool } from './supabaseAdmin';

function getProjectRef(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.host;
    const parts = host.split('.');
    return parts[0] || null;
  } catch {
    return null;
  }
}

export async function runSupabaseMigrations(): Promise<{ ran: string[] }> {
  const env = getEnv();
  const ref = getProjectRef(env.SUPABASE_URL || '') || '';
  void ref;
  const pool = getPgPool();
  if (!pool) throw new Error('pg not configured (missing SUPABASE_DB_* envs)');
  const client = await pool.connect();
  try {
    const ran: string[] = [];
    
    // (Previous migrations kept for reference in DB, though they usually use a migration table)
    // We'll just run the latest fix as sql019
    
    const sql020 = `
      -- 1. Add missing email tracking column
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_by_email text;

      -- 2. Rename lead_notes to notes if it exists, or just ensure notes exists
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_notes') THEN
          ALTER TABLE leads RENAME COLUMN lead_notes TO notes;
        END IF;
      END $$;

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

      -- 3. Fix check constraints for call_log outcome
      ALTER TABLE call_log DROP CONSTRAINT IF EXISTS call_log_outcome_check;
      ALTER TABLE call_log ADD CONSTRAINT call_log_outcome_check 
        CHECK (outcome IN ('no answer', 'left vm', 'spoke to dm', 'callback', 'not interested', 'closed'));

      -- 4. Fix check constraints for leads call_status
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_call_status_check;
      ALTER TABLE leads ADD CONSTRAINT leads_call_status_check 
        CHECK (call_status IN ('fresh', 'no answer', 'left vm', 'spoke to dm', 'callback', 'not interested', 'closed'));

      -- 5. Add rep_id and role to users table
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rep_id text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
      
      -- 6. Add check constraint for role
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('customer', 'sales_rep', 'admin'));
    `;

    await client.query('begin');
    // For simplicity, we just run the latest fix. 
    // In a real system we'd check a migrations table.
    await client.query(sql020); ran.push('020_user_roles_and_rep_id');
    await client.query('commit');
    return { ran };
  } catch (e) {
    try { await client.query('rollback'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
