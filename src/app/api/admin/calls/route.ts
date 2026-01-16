import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabaseAdmin();

  try {
    // 1. Fetch all calls
    const { data: calls, error: callsErr } = await supa
      .from('call_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (callsErr) throw callsErr;

    // 2. Fetch all leads and users to join manually for 100% accuracy
    const leadIds = Array.from(new Set((calls || []).map(c => c.lead_id).filter(Boolean)));
    const repIds = Array.from(new Set((calls || []).map(c => c.rep_id).filter(Boolean)));

    const [leadsRes, usersRes] = await Promise.all([
      supa.from('leads').select('id, name, phone').in('id', leadIds),
      supa.from('users').select('uid, email, rep_id').or(`uid.in.(${repIds.join(',')}),rep_id.in.(${repIds.join(',')})`)
    ]);

    const leadsMap = Object.fromEntries((leadsRes.data || []).map(l => [l.id, l]));
    
    // Map both UID and static rep_id to email
    const usersMap: Record<string, string> = {};
    (usersRes.data || []).forEach(u => {
      if (u.uid) usersMap[u.uid] = u.email;
      if (u.rep_id) usersMap[u.rep_id] = u.email;
    });

    const formattedCalls = (calls || []).map(c => {
      const lead = leadsMap[c.lead_id];
      // Try to find email from map, otherwise use the raw ID, otherwise 'System'
      const repEmail = usersMap[c.rep_id] || c.rep_id || 'System';
      
      return {
        id: c.id,
        timestamp: c.timestamp,
        outcome: c.outcome?.replace('_', ' ') || 'Unknown',
        notes: c.notes,
        followup_date: c.followup_date,
        rep_name: repEmail,
        lead_name: lead?.name || 'Unknown Business',
        lead_phone: lead?.phone || '-'
      };
    });

    return NextResponse.json({ calls: formattedCalls });
  } catch (err: any) {
    console.error('[ADMIN CALLS API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

