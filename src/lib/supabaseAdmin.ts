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
    // Determine database host
    const restUrl = new URL(env.SUPABASE_URL);
    const host = env.SUPABASE_DB_HOST || `db.${restUrl.hostname}`;
    const projectRef = restUrl.hostname.split('.')[0] || '';
    const port = env.SUPABASE_DB_PORT ? Number(env.SUPABASE_DB_PORT) : 5432;
    const user = env.SUPABASE_DB_USER || 'postgres';
    const database = env.SUPABASE_DB_NAME || 'postgres';
    
    // Use connection string for better compatibility with some poolers
    const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
    
    _pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1, // Minimize connections
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    return _pgPool;
  } catch {
    return null;
  }
}
