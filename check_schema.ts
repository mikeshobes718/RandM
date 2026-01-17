import { getSupabaseAdmin } from './src/lib/supabaseAdmin.ts';

async function check() {
  try {
    const supa = getSupabaseAdmin();
    const { data, error } = await supa.rpc('get_table_columns', { table_name: 'leads' });
    if (error) {
      // If RPC doesn't exist, try querying a single row
      const { data: lead } = await supa.from('leads').select('*').limit(1).single();
      console.log('Lead columns:', Object.keys(lead || {}));
    } else {
      console.log('Columns:', data);
    }
  } catch (e) {
    console.error('Schema check error:', e);
  }
}
check();
