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
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 30,
      connect_timeout: 5,
    });

    // Provide a shim that looks like a pg Pool
    _sql = {
      query: async (text: string, params: any[]) => {
        const result = await sql.unsafe(text, params);
        return { rows: Array.from(result) };
      },
      connect: async () => {
        return {
          query: async (text: string, params: any[]) => {
            const result = await sql.unsafe(text, params);
            return { rows: Array.from(result) };
          },
          release: () => {},
        };
      },
      end: async () => {
        await sql.end();
      }
    };

    return _sql;
  } catch (err) {
    console.error('[POSTGRES] Error creating pool shim:', err);
    return null;
  }
}
