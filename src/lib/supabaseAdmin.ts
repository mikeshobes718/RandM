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

function stripEnvQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const t = value.trim();
  if (t.length >= 2) {
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
  }
  return t;
}

let _sql: any = null;
export function getSql() {
  if (_sql) return _sql;
  const env = getEnv();

  const pooledUrl = stripEnvQuotes(env.SUPABASE_DATABASE_URL);
  const password = stripEnvQuotes(env.SUPABASE_DB_PASSWORD);
  if (!pooledUrl && !password) return null;

  const host = stripEnvQuotes(env.SUPABASE_DB_HOST) || 'aws-0-us-east-1.pooler.supabase.com';
  // Default 5432 = session pooler (works reliably with postgres.js). Use 6543 + prepare:false only for transaction mode.
  const port = Number(stripEnvQuotes(env.SUPABASE_DB_PORT)) || 5432;
  const user = stripEnvQuotes(env.SUPABASE_DB_USER) || 'postgres.rhnxzpbhoqbvoqyqmfox';
  const database = stripEnvQuotes(env.SUPABASE_DB_NAME) || 'postgres';

  // Supabase + postgres.js: object-style config often triggers SASL_SIGNATURE_MISMATCH on the
  // pooler; building a URL (with encoded password) matches what Supabase docs recommend.
  const connectionString =
    pooledUrl ||
    `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password!)}@${host}:${port}/${database}`;

  const transactionPooler =
    port === 6543 || (!!pooledUrl && /:6543(\/|\?|#|$)/.test(pooledUrl));

  _sql = postgres(connectionString, {
    ssl: 'require',
    prepare: !transactionPooler,
    max: 1, // serverless-friendly
    connect_timeout: 15,
    idle_timeout: 20,
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
