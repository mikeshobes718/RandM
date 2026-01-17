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

    // 2. Fetch all leads
    const leadIds = Array.from(new Set((calls || []).map(c => c.lead_id).filter(Boolean)));
    const { data: leadsData } = await supa.from('leads').select('id, name, phone, last_called_by_email').in('id', leadIds.length > 0 ? leadIds : ['none']);
    const leadsMap = Object.fromEntries((leadsData || []).map(l => [l.id, l]));

    // 3. Fetch ALL users to build a comprehensive lookup
    const { data: usersData } = await supa.from('users').select('uid, email, rep_id');
    
    // Build multiple lookups for maximum matching
    const uidToEmail: Record<string, string> = {};
    const repIdToEmail: Record<string, string> = {};
    (usersData || []).forEach(u => {
      if (u.uid && u.email) uidToEmail[u.uid] = u.email;
      if (u.rep_id && u.email) repIdToEmail[u.rep_id] = u.email;
    });

    const formattedCalls = (calls || []).map(c => {
      const lead = leadsMap[c.lead_id];
      
      // Priority order for resolving rep identity:
      // 1. Look up rep_id as UID
      // 2. Look up rep_id as static rep_id
      // 3. Use last_called_by_email from lead record
      // 4. If rep_id looks like an email, use it directly
      // 5. Fall back to 'System'
      let repEmail = 'System';
      
      if (c.rep_id) {
        if (uidToEmail[c.rep_id]) {
          repEmail = uidToEmail[c.rep_id];
        } else if (repIdToEmail[c.rep_id]) {
          repEmail = repIdToEmail[c.rep_id];
        } else if (c.rep_id.includes('@')) {
          repEmail = c.rep_id;
        } else if (lead?.last_called_by_email) {
          repEmail = lead.last_called_by_email;
        } else {
          // If we have an ID but can't map it to an email, show the ID itself
          repEmail = c.rep_id;
        }
      } else if (lead?.last_called_by_email) {
        repEmail = lead.last_called_by_email;
      }
      
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
    return NextResponse.json({ error: err.message, calls: [] }, { status: 500 });
  }
}

