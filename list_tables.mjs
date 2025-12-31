import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try a direct query to pg_catalog if possible, 
    // but usually we just want to see what we can query.
    console.log('Tables check via direct query:');
    const { data: tables, error: err2 } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
    if (err2) {
        console.error('Error fetching tables:', err2);
        // Fallback: just list known tables and check existence
        const known = ['businesses', 'feedback', 'review_contact_captures', 'review_events', 'square_connections', 'square_customers', 'subscriptions'];
        for (const t of known) {
            const { error: e } = await supabase.from(t).select('id').limit(1);
            console.log(`Table ${t}: ${e ? 'Error/Missing' : 'Exists'}`);
        }
    } else {
        console.log(tables.map(t => t.tablename));
    }
  } else {
    console.log(data);
  }
}

run();
