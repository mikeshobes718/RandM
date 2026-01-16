import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supa = getSupabaseAdmin();

  // Default values if tables don't exist
  const defaults = {
    mrr: 0, activeCustomers: 0, activeReps: 0, closesThisWeek: 0, commissionsOwed: 0,
    callsToday: 0, callsThisWeek: 0, totalCalls: 0, totalCloses: 0, repActivity: []
  };

  try {
    // 1. MRR from subscriptions
    const { data: subs } = await supa.from('subscriptions').select('plan_id').eq('status', 'active');
    const mrr = (subs || []).reduce((sum, s) => {
      if (s.plan_id === 'unlimited') return sum + 199;
      if (s.plan_id === 'pro') return sum + 99;
      return sum + 49;
    }, 0);

    // 2. Active Customers
    const { count: activeCustomers } = await supa.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');

    // 3. Active Reps
    let activeReps = 0;
    const { count: repsCount, error: repsErr } = await supa.from('reps').select('*', { count: 'exact', head: true }).in('status', ['trial', 'active']);
    if (!repsErr) activeReps = repsCount || 0;

    // 4. Closes This Week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: closesThisWeek } = await supa.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);

    // 5. Commissions Owed
    let commissionsOwed = 0;
    const { data: pendingComms } = await supa.from('commissions').select('amount').eq('status', 'pending');
    if (pendingComms) commissionsOwed = pendingComms.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    // 6. Call Metrics (only if call_log table exists)
    let callsToday = 0, callsThisWeek = 0, totalCalls = 0, totalCloses = 0;
    const todayStart = new Date().toISOString().split('T')[0];
    
    const { count: ct } = await supa.from('call_log').select('*', { count: 'exact', head: true }).gte('timestamp', todayStart);
    if (ct !== null) callsToday = ct;
    
    const { count: cw } = await supa.from('call_log').select('*', { count: 'exact', head: true }).gte('timestamp', weekAgo);
    if (cw !== null) callsThisWeek = cw;
    
    const { count: tc } = await supa.from('call_log').select('*', { count: 'exact', head: true });
    if (tc !== null) totalCalls = tc;
    
    const { count: tcl } = await supa.from('call_log').select('*', { count: 'exact', head: true }).eq('outcome', 'closed');
    if (tcl !== null) totalCloses = tcl;

    // 7. Rep Activity
    let repActivity: any[] = [];
    const { data: activeRepsList } = await supa.from('reps').select('id, name').in('status', ['trial', 'active']);
    if (activeRepsList) {
      repActivity = await Promise.all(activeRepsList.map(async (rep) => {
        const { count } = await supa.from('call_log').select('*', { count: 'exact', head: true }).eq('rep_id', rep.id).gte('timestamp', weekAgo);
        return { name: rep.name, call_count: count || 0 };
      }));
      repActivity.sort((a, b) => b.call_count - a.call_count);
    }

    return NextResponse.json({
      mrr,
      activeCustomers: activeCustomers || 0,
      activeReps,
      closesThisWeek: closesThisWeek || 0,
      commissionsOwed,
      callsToday,
      callsThisWeek,
      totalCalls,
      totalCloses,
      repActivity,
    });
  } catch (err: any) {
    console.error('[ADMIN OVERVIEW API] Error:', err);
    return NextResponse.json({ ...defaults, error: err.message });
  }
}
