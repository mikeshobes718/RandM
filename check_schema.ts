import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function check() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa.rpc('get_schema_info'); // If exists
  if (error) {
    const { data: schemas, error: schemaError } = await supa.from('information_schema.schemata').select('schema_name');
    console.log('Schemas:', schemas?.map(s => s.schema_name), schemaError?.message);
  } else {
    console.log('Schema info:', data);
  }
}

check();
