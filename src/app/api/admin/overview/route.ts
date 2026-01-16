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
    const { count: repsCount, error: repsErr } = await supa.from('users').select('*', { count: 'exact', head: true }).eq('role', 'sales_rep');
    if (!repsErr) activeReps = repsCount || 0;

    // 4. Closes This Week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: closesThisWeek } = await supa.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'closed').gte('last_called_at', weekAgo);

    // 5. Commissions Owed (Legacy or placeholders for now)
    let commissionsOwed = 0;

    // 6. Call Metrics
    let callsToday = 0, callsThisWeek = 0, totalCalls = 0, totalCloses = 0;
    const todayStart = new Date().toISOString().split('T')[0];
    
    const { count: ct } = await supa.from('call_log').select('*', { count: 'exact', head: true }).gte('timestamp', todayStart);
    if (ct !== null) callsToday = ct;
    
    const { count: cw } = await supa.from('call_log').select('*', { count: 'exact', head: true }).gte('timestamp', weekAgo);
    if (cw !== null) callsThisWeek = cw;
    
    const { count: tc } = await supa.from('call_log').select('*', { count: 'exact', head: true });
    if (tc !== null) totalCalls = tc;
    
    const { count: tcl } = await supa.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'closed');
    if (tcl !== null) totalCloses = tcl;

    // 7. Rep Activity (Top 5)
    const { data: allUsers } = await supa.from('users').select('uid, email, rep_id');
    const uidToUser = Object.fromEntries((allUsers || []).map(u => [u.uid, u]));

    // 8. Recent Activity Feed
    // We'll fetch call logs and manually join with users for 100% accuracy
    const [recentCalls, recentUsers] = await Promise.all([
      supa.from('call_log').select('timestamp, outcome, rep_id, lead_id').order('timestamp', { ascending: false }).limit(15),
      supa.from('users').select('created_at, email, role').order('created_at', { ascending: false }).limit(5)
    ]);

    const activity: any[] = [];
    
    // Process calls (Highest Priority for "Real" activity)
    if (recentCalls.data) {
      for (const c of recentCalls.data) {
        const user = c.rep_id ? uidToUser[c.rep_id] : null;
        // If we don't have a user record for this UID, try to find by rep_id string
        let repEmail = user?.email;
        if (!repEmail && c.rep_id) {
          const { data: fallbackUser } = await supa.from('users').select('email').eq('rep_id', c.rep_id).maybeSingle();
          repEmail = fallbackUser?.email;
        }

        const { data: leadData } = await supa.from('leads').select('name').eq('id', c.lead_id).maybeSingle();
        
        activity.push({
          time: c.timestamp,
          event: `${repEmail || 'System'} logged a call: ${c.outcome.replace('_', ' ')}`,
          detail: leadData?.name || 'Business Lead',
          type: c.outcome === 'closed' || c.outcome === 'close' ? 'close' : 'log'
        });
      }
    }

    // Process new users (Lower priority)
    if (recentUsers.data) {
      recentUsers.data.forEach(u => {
        activity.push({
          time: u.created_at,
          event: `New user joined: ${u.email}`,
          detail: `Account Role: ${u.role}`,
          type: 'rep'
        });
      });
    }

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
      recentActivity: activity.slice(0, 15)
    });
  } catch (err: any) {
    console.error('[ADMIN OVERVIEW API] Error:', err);
    return NextResponse.json({ ...defaults, error: err.message });
  }
}
