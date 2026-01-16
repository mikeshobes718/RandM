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

    // 2. Get state breakdown (Fetch in chunks to overcome 1000 row limit)
    const breakdown: Record<string, number> = {};
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supa
        .from('leads')
        .select('state')
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(l => {
          const state = l.state || 'Unknown';
          breakdown[state] = (breakdown[state] || 0) + 1;
        });
        offset += limit;
        // Safety break if it takes too many loops
        if (offset > 20000) hasMore = false; 
        if (data.length < limit) hasMore = false;
      }
    }

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
