import { getSupabaseAdmin } from './src/lib/supabaseAdmin.ts';

async function check() {
  try {
    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from('leads')
      .select('id, name, call_status, last_called_by_email, last_called_at')
      .eq('call_status', 'closed');
    
    console.log('Closes:', JSON.stringify(data, null, 2));
    if (error) console.error('Error:', error);

    const { data: calls } = await supa
      .from('call_log')
      .select('*')
      .eq('outcome', 'closed');
    console.log('Call Logs (closed):', JSON.stringify(calls, null, 2));
  } catch (e) {
    console.error('Script Error:', e);
  }
}

check();
