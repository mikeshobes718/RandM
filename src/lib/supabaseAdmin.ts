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
    
    // Direct connection to DB (bypassing pooler if possible)
    const host = '44.208.221.186'; // Direct IP for rhnxzpbhoqbvoqyqmfox
    const port = 5432;
    const user = 'postgres.rhnxzpbhoqbvoqyqmfox'; // Need full user for pooler IP
    const database = 'postgres';

    _pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: { 
        rejectUnauthorized: false,
        // Supabase often needs this for SCRAM
      },
      max: 1, // Only 1 for migrations
    });

    return _pool;
  } catch (err) {
    console.error('[PG POOL] Error creating pool:', err);
    return null;
  }
}
