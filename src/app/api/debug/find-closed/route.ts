import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  const { data: closedLeads } = await supa
    .from('leads')
    .select('*')
    .eq('call_status', 'closed');
  
  return NextResponse.json({ closedLeads });
}
