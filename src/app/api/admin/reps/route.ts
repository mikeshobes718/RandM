import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supa = getSupabaseAdmin();

  try {
    // Check if reps table exists
    const { data: reps, error } = await supa.from('reps').select('*').order('created_at', { ascending: false });

    if (error) {
      // Tables don't exist yet - return empty array
      if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
        return NextResponse.json({ reps: [], message: 'Tables not yet created. Run migrations first.' });
      }
      throw error;
    }

    // Enrich with stats
    const enrichedReps = await Promise.all((reps || []).map(async (rep: any) => {
      // Get call stats
      const { count: callsLogged } = await supa.from('call_log').select('*', { count: 'exact', head: true }).eq('rep_id', rep.id);
      const { count: callsLast7Days } = await supa.from('call_log').select('*', { count: 'exact', head: true }).eq('rep_id', rep.id).gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { count: leadsAssigned } = await supa.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', rep.id);
      const { count: overdueFollowups } = await supa.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', rep.id).lt('next_followup', new Date().toISOString().split('T')[0]);
      
      // Get closes from businesses table
      const { count: closes } = await supa.from('businesses').select('*', { count: 'exact', head: true }).eq('closed_by', rep.id);
      
      // Get commissions
      const { data: commissionsData } = await supa.from('commissions').select('amount, status').eq('rep_id', rep.id);
      const totalEarned = (commissionsData || []).reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0);
      const pendingPayout = (commissionsData || []).filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0);

      // Calculate days since active
      const { data: lastCall } = await supa.from('call_log').select('timestamp').eq('rep_id', rep.id).order('timestamp', { ascending: false }).limit(1).single();
      const daysSinceActive = lastCall ? Math.floor((Date.now() - new Date(lastCall.timestamp).getTime()) / 86400000) : 999;

      const avgCallsPerDay = (callsLogged || 0) / Math.max(1, Math.ceil((Date.now() - new Date(rep.start_date).getTime()) / 86400000));

      return {
        ...rep,
        calls_logged: callsLogged || 0,
        calls_last_7_days: callsLast7Days || 0,
        leads_assigned: leadsAssigned || 0,
        overdue_followups: overdueFollowups || 0,
        closes: closes || 0,
        total_earned: totalEarned,
        pending_payout: pendingPayout,
        days_since_active: daysSinceActive,
        avg_calls_per_day: avgCallsPerDay,
      };
    }));

    return NextResponse.json({ reps: enrichedReps });
  } catch (err: any) {
    console.error('[ADMIN REPS API] Error:', err);
    return NextResponse.json({ reps: [], error: err.message });
  }
}

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();

  try {
    const { name, email, whatsapp, payment_method, payment_id, status, start_date, notes } = await req.json();

    // Generate unique tracking code
    const tracking_code = `rep_${Math.random().toString(36).substring(2, 8)}`;

    const { data: rep, error } = await supa.from('reps').insert({
      name,
      email,
      whatsapp,
      payment_method,
      payment_id,
      status: status || 'trial',
      start_date: start_date || new Date().toISOString(),
      tracking_code,
      notes
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ rep });
  } catch (err: any) {
    console.error('[ADMIN REPS API] POST Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
