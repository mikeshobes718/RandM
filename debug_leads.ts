import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function debug() {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('leads')
    .select('id, name, call_status, last_called_by_email, last_called_at')
    .eq('call_status', 'closed');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Closed Leads:', JSON.stringify(data, null, 2));
}

debug();
