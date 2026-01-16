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

let _pgPool: Pool | null = null;
export function getPgPool(): Pool | null {
  try {
    const env = getEnv();
    const password = env.SUPABASE_DB_PASSWORD;
    if (!password) return null;
    if (_pgPool) return _pgPool;
    
    _pgPool = new Pool({
      host: env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com',
      port: Number(env.SUPABASE_DB_PORT) || 6543,
      database: env.SUPABASE_DB_NAME || 'postgres',
      user: env.SUPABASE_DB_USER || 'postgres.rhnxzpbhoqbvoqyqmfox',
      password,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    return _pgPool;
  } catch {
    return null;
  }
}
