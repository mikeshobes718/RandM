import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  try {
    const { data, error } = await supa
      .from('leads')
      .select('state');

    if (error) throw error;

    const breakdown: Record<string, number> = {};
    (data || []).forEach(l => {
      const state = l.state || 'Unknown';
      breakdown[state] = (breakdown[state] || 0) + 1;
    });

    const sorted = Object.entries(breakdown)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ 
      breakdown: sorted, 
      totalStates: sorted.length,
      totalLeads: (data || []).length
    });
  } catch (error: any) {
    console.error('[LEAD STATS API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
