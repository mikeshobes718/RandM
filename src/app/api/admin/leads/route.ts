import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  try {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // 1. Fetch all leads with call activity (use * and extract what we need)
    const { data: leads, error: leadsErr } = await supa
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (leadsErr) {
      console.error('[ADMIN LEADS] Leads query error:', leadsErr);
      throw leadsErr;
    }

    // 2. Fetch all call_log entries for today
    const { data: callsToday, error: callsErr } = await supa
      .from('call_log')
      .select('*')
      .gte('timestamp', today);
    
    if (callsErr) {
      console.error('[ADMIN LEADS] Calls query error:', callsErr);
      throw callsErr;
    }

    // 3. Get closes this month - be resilient to missing columns
    let closesData: any[] = [];
    try {
      const { data, error } = await supa
        .from('leads')
        .select('id, last_called_by_email')
        .eq('call_status', 'closed')
        .gte('last_called_at', firstOfMonth);
      
      if (!error && data) {
        closesData = data;
      } else {
        // Fallback: count from call_log instead
        console.warn('[ADMIN LEADS] Closes query failed, using call_log fallback');
        const { data: closeLogs } = await supa
          .from('call_log')
          .select('id, rep_id')
          .eq('outcome', 'closed')
          .gte('timestamp', firstOfMonth);
        closesData = closeLogs || [];
      }
    } catch (e) {
      console.warn('[ADMIN LEADS] Closes query error, skipping:', e);
    }

    // 4. Fetch all users for rep mapping
    const { data: users } = await supa.from('users').select('uid, email, rep_id, role');

    // Build lookups
    const uidToEmail: Record<string, string> = {};
    (users || []).forEach(u => {
      if (u.uid) uidToEmail[u.uid] = u.email;
      if (u.rep_id) uidToEmail[u.rep_id] = u.email;
    });

    // Calculate per-rep metrics
    const repStats: Record<string, { calls_today: number; appointments_today: number; closes_this_month: number; email: string; name: string }> = {};

    // Process today's calls
    (callsToday || []).forEach((call: any) => {
      const email = uidToEmail[call.rep_id] || 
                    (call.rep_id && call.rep_id.includes('@') ? call.rep_id : null) || 
                    'unknown';
      
      if (!repStats[email]) {
        repStats[email] = { 
          calls_today: 0, 
          appointments_today: 0, 
          closes_this_month: 0, 
          email, 
          name: email.includes('@') ? email.split('@')[0] : email 
        };
      }
      repStats[email].calls_today++;
      if (call.outcome === 'callback' || call.outcome === 'appointment') {
        repStats[email].appointments_today++;
      }
    });

    // Process closes this month
    (closesData || []).forEach((item: any) => {
      // Could be a lead object or a call_log object
      const email = item.last_called_by_email || 
                    uidToEmail[item.rep_id] || 
                    (item.rep_id && item.rep_id.includes('@') ? item.rep_id : null) || 
                    'unknown';
      
      if (!repStats[email]) {
        repStats[email] = { 
          calls_today: 0, 
          appointments_today: 0, 
          closes_this_month: 0, 
          email, 
          name: email.includes('@') ? email.split('@')[0] : email 
        };
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
    // For closes, if we used call_log fallback, count unique lead_ids
    const uniqueClosesCount = closesData[0]?.rep_id !== undefined 
      ? new Set(closesData.map(c => c.lead_id || c.id)).size 
      : closesData.length;

    const totalMetrics = {
      callsToday: (callsToday || []).length,
      appointments: (callsToday || []).filter((c: any) => c.outcome === 'callback' || c.outcome === 'appointment').length,
      closesThisMonth: uniqueClosesCount,
    };

    // Format leads for response - handle missing columns gracefully
    const formattedLeads = (leads || []).map((l: any) => ({
      id: l.id,
      name: l.name || 'Unknown',
      phone: l.phone,
      city: l.city,
      state: l.state,
      rating: l.rating,
      times_called: l.times_called || 0,
      status: l.call_status || l.status || 'fresh',
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
