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
          let state = (l.state || 'Unknown').trim();
          // Normalize common state issues
          if (state.length > 2) {
             // If it's "New York", map to "NY" if possible? 
             // For now, let's just use what we have but trim it.
          }
          breakdown[state] = (breakdown[state] || 0) + 1;
        });
        offset += limit;
        if (data.length < limit) hasMore = false;
        // Increase safety limit for state breakdown to 30k leads
        if (offset > 30000) hasMore = false; 
      }
    }

    const sorted = Object.entries(breakdown)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // Sum the breakdown to double-check against totalLeads
    const breakdownSum = sorted.reduce((sum, s) => sum + s.count, 0);
    
    return NextResponse.json({ 
      breakdown: sorted, 
      totalStates: sorted.length,
      totalLeads: totalLeads || breakdownSum
    });
  } catch (error: any) {
    console.error('[LEAD STATS API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
