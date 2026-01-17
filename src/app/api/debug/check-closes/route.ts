import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  const { data: closes } = await supa
    .from('leads')
    .select('id, name, call_status, last_called_by_email, last_called_at')
    .eq('call_status', 'closed');
  
  const { data: calls } = await supa
    .from('call_log')
    .select('*')
    .eq('outcome', 'closed');

  const { data: users } = await supa.from('users').select('*');

  return NextResponse.json({ closes, calls, users });
}
