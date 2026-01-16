import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();
  try {
    // 1. Get TOTAL count accurately
    const { count: totalLeads, error: countErr } = await supa
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;

    // 2. Get state breakdown (using a grouped query if possible, or selecting just state)
    // Supabase JS doesn't support GROUP BY directly in a clean way, so we select the 'state' column.
    // To overcome the 1000 limit, we'll fetch in batches or just use a raw SQL query via our helper.
    
    // For now, let's try to get as many as possible or use multiple requests if needed.
    // Actually, a better way is to use our getPgPool if available, but SASL is failing locally.
    // Let's use the supa client with a larger range.
    
    const { data, error } = await supa
      .from('leads')
      .select('state')
      .range(0, 10000); // Support up to 10k leads for breakdown

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
      totalLeads: totalLeads || (data || []).length
    });
  } catch (error: any) {
    console.error('[LEAD STATS API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
