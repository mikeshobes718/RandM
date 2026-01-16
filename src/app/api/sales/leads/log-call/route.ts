import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const { leadId, repId, outcome, notes, followupDate } = await req.json();

    if (!leadId) return new NextResponse('Missing leadId', { status: 400 });

    // 1. Create call log entry
    const { error: logError } = await supa.from('call_log').insert({
      lead_id: leadId,
      rep_id: repId,
      outcome,
      notes,
      followup_date: followupDate || null,
    });

    if (logError) throw logError;

    // 2. Update lead status and stats
    // We need to fetch current times_called
    const { data: lead } = await supa.from('leads').select('times_called').eq('id', leadId).single();
    const newTimesCalled = (lead?.times_called || 0) + 1;

    const { error: updateError } = await supa.from('leads').update({
      times_called: newTimesCalled,
      last_called_at: new Date().toISOString(),
      last_called_by: repId,
      call_status: outcome.replace(/_/g, ' '), // mapping 'no_answer' to 'no answer', etc.
      next_followup: followupDate || null,
      lead_notes: notes,
    }).eq('id', leadId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOG CALL API] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
