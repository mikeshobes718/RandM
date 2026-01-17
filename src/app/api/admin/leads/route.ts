import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  try {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // 1. Fetch all leads with call activity
    const { data: leads, error: leadsErr } = await supa
      .from('leads')
      .select('id, name, phone, city, state, rating, times_called, call_status, last_called_at, last_called_by_email')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (leadsErr) throw leadsErr;

    // 2. Fetch all call_log entries for today
    const { data: callsToday, error: callsErr } = await supa
      .from('call_log')
      .select('id, rep_id, outcome, timestamp')
      .gte('timestamp', today);
    
    if (callsErr) throw callsErr;

    // 3. Get closes this month from leads table
    const { data: closesData, error: closesErr } = await supa
      .from('leads')
      .select('id, last_called_by_email')
      .eq('call_status', 'closed')
      .gte('last_called_at', firstOfMonth);
    
    if (closesErr) throw closesErr;

    // 4. Get unique rep identifiers and map to emails
    const allRepIds = Array.from(new Set([
      ...(callsToday || []).map(c => c.rep_id).filter(Boolean),
      ...(closesData || []).map(c => c.last_called_by_email).filter(Boolean)
    ]));

    // Fetch users that might match
    const { data: users, error: usersErr } = await supa
      .from('users')
      .select('uid, email, rep_id, role');
    
    if (usersErr) throw usersErr;

    // Build lookups
    const uidToEmail: Record<string, string> = {};
    const emailToUser: Record<string, any> = {};
    (users || []).forEach(u => {
      if (u.uid) uidToEmail[u.uid] = u.email;
      if (u.rep_id) uidToEmail[u.rep_id] = u.email;
      if (u.email) emailToUser[u.email.toLowerCase()] = u;
    });

    // Calculate per-rep metrics
    const repStats: Record<string, { calls_today: number; appointments_today: number; closes_this_month: number; email: string; name: string }> = {};

    // Process today's calls
    (callsToday || []).forEach(call => {
      const email = uidToEmail[call.rep_id] || call.rep_id || 'unknown';
      if (!repStats[email]) {
        repStats[email] = { calls_today: 0, appointments_today: 0, closes_this_month: 0, email, name: email.split('@')[0] };
      }
      repStats[email].calls_today++;
      if (call.outcome === 'callback' || call.outcome === 'appointment') {
        repStats[email].appointments_today++;
      }
    });

    // Process closes this month
    (closesData || []).forEach(lead => {
      const email = lead.last_called_by_email || 'unknown';
      if (!repStats[email]) {
        repStats[email] = { calls_today: 0, appointments_today: 0, closes_this_month: 0, email, name: email.split('@')[0] };
      }
      repStats[email].closes_this_month++;
    });

    // Convert to array and filter out 'unknown'
    const repMetrics = Object.values(repStats)
      .filter(r => r.email !== 'unknown')
      .map(r => ({
        rep_name: r.name,
        rep_email: r.email,
        calls_today: r.calls_today,
        appointments_today: r.appointments_today,
        closes_this_month: r.closes_this_month
      }))
      .sort((a, b) => b.closes_this_month - a.closes_this_month || b.calls_today - a.calls_today);

    // Calculate totals directly from call_log and leads (most accurate)
    const totalMetrics = {
      callsToday: (callsToday || []).length,
      appointments: (callsToday || []).filter(c => c.outcome === 'callback' || c.outcome === 'appointment').length,
      closesThisMonth: (closesData || []).length,
    };

    // Format leads for response
    const formattedLeads = (leads || []).map(l => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      city: l.city,
      state: l.state,
      rating: l.rating,
      times_called: l.times_called || 0,
      status: l.call_status || 'fresh',
      last_called_at: l.last_called_at,
      assigned_to_name: l.last_called_by_email || 'Unassigned'
    }));

    console.log('[ADMIN LEADS] Totals:', totalMetrics, 'Reps:', repMetrics.length);

    return NextResponse.json({ 
      leads: formattedLeads,
      repMetrics,
      totalMetrics
    });
  } catch (err: any) {
    console.error('Admin Leads API error:', err);
    return NextResponse.json({ error: err.message, leads: [], repMetrics: [], totalMetrics: { callsToday: 0, appointments: 0, closesThisMonth: 0 } }, { status: 500 });
  }
}
