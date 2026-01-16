import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';
import postgres from 'postgres';

let _supabase: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabase) return _supabase;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return _supabase;
}

let _sql: any = null;
export function getPgPool(): any {
  try {
    const env = getEnv();
    const password = env.SUPABASE_DB_PASSWORD;
    if (!password) return null;
    if (_sql) return _sql;
    
    const restUrl = new URL(env.SUPABASE_URL);
    const host = env.SUPABASE_DB_HOST || `db.${restUrl.hostname}`;
    const port = env.SUPABASE_DB_PORT ? Number(env.SUPABASE_DB_PORT) : 5432;
    const user = env.SUPABASE_DB_USER || 'postgres';
    const database = env.SUPABASE_DB_NAME || 'postgres';
    
    _sql = postgres({
      host,
      port,
      database,
      username: user,
      password,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
    });
    
    // Mock the 'connect' and 'query' behavior for migrations.ts which expects a 'pg' pool
    return {
      connect: async () => {
        return {
          query: async (sql: string, params?: any[]) => {
            if (sql.toLowerCase().includes('begin')) return _sql.begin(async () => {});
            if (sql.toLowerCase().includes('commit')) return;
            if (sql.toLowerCase().includes('rollback')) return;
            return _sql.unsafe(sql, params || []);
          },
          release: () => {},
        };
      },
      end: async () => {
        if (_sql) await _sql.end();
        _sql = null;
      },
    };
  } catch {
    return null;
  }
}
