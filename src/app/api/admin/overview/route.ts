import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  // Default values if tables don't exist
  const defaults = {
    mrr: 0, activeCustomers: 0, activeReps: 0, closesThisWeek: 0, commissionsOwed: 0,
    callsToday: 0, callsThisWeek: 0, totalCalls: 0, totalCloses: 0, repActivity: [],
    recentActivity: []
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

    // 6. Call Metrics
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

    // 8. Recent Activity Feed
    const [recentCalls, recentReps, recentBiz] = await Promise.all([
      supa.from('call_log').select('timestamp, outcome, reps(name), leads(name)').order('timestamp', { ascending: false }).limit(5),
      supa.from('reps').select('created_at, name').order('created_at', { ascending: false }).limit(3),
      supa.from('businesses').select('created_at, name').order('created_at', { ascending: false }).limit(3)
    ]);

    const activity: any[] = [];
    
    (recentCalls.data || []).forEach(c => {
      activity.push({
        time: c.timestamp,
        event: `${(c as any).reps?.name || 'A rep'} logged a call: ${c.outcome}`,
        detail: (c as any).leads?.name || 'Business',
        type: c.outcome === 'closed' ? 'close' : 'log'
      });
    });

    (recentReps.data || []).forEach(r => {
      activity.push({
        time: r.created_at,
        event: `${r.name} joined as a rep`,
        detail: 'New Onboarding',
        type: 'rep'
      });
    });

    (recentBiz.data || []).forEach(b => {
      activity.push({
        time: b.created_at,
        event: `New customer: ${b.name}`,
        detail: 'Direct Sign-up',
        type: 'close'
      });
    });

    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

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
      recentActivity: activity.slice(0, 8)
    });
  } catch (err: any) {
    console.error('[ADMIN OVERVIEW API] Error:', err);
    return NextResponse.json({ ...defaults, error: err.message });
  }
}
