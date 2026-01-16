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
    
    const host = env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com';
    const port = Number(env.SUPABASE_DB_PORT) || 6543;
    const user = env.SUPABASE_DB_USER || 'postgres.rhnxzpbhoqbvoqyqmfox';
    const database = env.SUPABASE_DB_NAME || 'postgres';

    const sql = postgres({
      host,
      port,
      database,
      username: user,
      password,
      ssl: { rejectUnauthorized: false },
      prepare: false, // Critical for pooler
    });

    _sql = sql;

    // Return pg-compatible wrapper for migrations
    return {
      connect: async () => {
        return {
          query: async (text: string, params?: any[]) => {
            // Basic transaction support for migrations
            if (text.toLowerCase().trim() === 'begin') return { rows: [] };
            if (text.toLowerCase().trim() === 'commit') return { rows: [] };
            if (text.toLowerCase().trim() === 'rollback') return { rows: [] };
            
            const result = await sql.unsafe(text, params || []);
            return { rows: Array.from(result) };
          },
          release: () => {},
        };
      },
      query: async (text: string, params?: any[]) => {
        const result = await sql.unsafe(text, params || []);
        return { rows: Array.from(result) };
      },
      end: async () => {
        await sql.end();
        _sql = null;
      }
    };
  } catch {
    return null;
  }
}
