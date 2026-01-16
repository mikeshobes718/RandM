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
export function getSql() {
  if (_sql) return _sql;
  const env = getEnv();
  const password = env.SUPABASE_DB_PASSWORD;
  if (!password) return null;

  const host = env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com';
  const port = Number(env.SUPABASE_DB_PORT) || 6543;
  const user = env.SUPABASE_DB_USER || 'postgres.rhnxzpbhoqbvoqyqmfox';
  const database = env.SUPABASE_DB_NAME || 'postgres';

  _sql = postgres({
    host,
    port,
    database,
    username: user,
    password,
    ssl: 'require',
    prepare: false, // Required for Supabase transaction pooler
  });

  return _sql;
}

/**
 * @deprecated Use getSql() instead. Maintaining this for migrations.ts compatibility.
 */
export function getPgPool(): any {
  const sql = getSql();
  if (!sql) return null;

  return {
    connect: async () => {
      return {
        query: async (text: string, params?: any[]) => {
          // Simplistic adapter for migrations.ts
          if (text.toLowerCase() === 'begin') { await sql`BEGIN`; return { rows: [] }; }
          if (text.toLowerCase() === 'commit') { await sql`COMMIT`; return { rows: [] }; }
          if (text.toLowerCase() === 'rollback') { await sql`ROLLBACK`; return { rows: [] }; }
          
          const result = await sql.unsafe(text, params || []);
          return { rows: result, count: result.length };
        },
        release: () => {},
      };
    },
    query: async (text: string, params?: any[]) => {
      const result = await sql.unsafe(text, params || []);
      return { rows: result, count: result.length };
    },
    end: async () => {
      await sql.end();
      _sql = null;
    }
  };
}
