import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';
import { Pool } from 'pg';

let _supabase: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabase) return _supabase;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return _supabase;
}

let _pool: Pool | null = null;
export function getPgPool(): Pool | null {
  try {
    const env = getEnv();
    const password = env.SUPABASE_DB_PASSWORD;
    if (!password) return null;
    if (_pool) return _pool;
    
    const host = env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com';
    const port = Number(env.SUPABASE_DB_PORT) || 6543;
    const user = env.SUPABASE_DB_USER || 'postgres.rhnxzpbhoqbvoqyqmfox';
    const database = env.SUPABASE_DB_NAME || 'postgres';

    // Best combination for Supabase + pg + SCRAM
    const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

    _pool = new Pool({
      connectionString,
      ssl: { 
        rejectUnauthorized: false 
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    return _pool;
  } catch (err) {
    console.error('[PG POOL] Error creating pool:', err);
    return null;
  }
}
