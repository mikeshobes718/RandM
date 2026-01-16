import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const body = await req.json();
    const { leadId, googlePlaceId, leadData, repId, outcome, notes, followupDate } = body;

    // First check if leads table exists
    const { error: tableCheck } = await supa.from('leads').select('id').limit(1);
    if (tableCheck) {
      const msg = tableCheck.message || '';
      if (msg.includes('does not exist') || msg.includes('schema cache') || tableCheck.code === 'PGRST204') {
        return NextResponse.json({ 
          error: `Database tables not set up yet. Please run the SQL migration in Supabase Dashboard. See /MANUAL_MIGRATION_SQL.md for instructions.`,
          hint: 'Go to Supabase Dashboard → SQL Editor → Run the migration SQL',
          code: 'TABLES_MISSING'
        }, { status: 503 });
      }
    }

    let targetLeadId = leadId;

    // 1. If leadId is missing, try to find or create the lead in the DB
    if (!targetLeadId && googlePlaceId) {
      // Check if lead already exists by google_place_id
      const { data: existingLead } = await supa
        .from('leads')
        .select('id')
        .eq('google_place_id', googlePlaceId)
        .single();

      if (existingLead) {
        targetLeadId = existingLead.id;
      } else if (leadData) {
        // Create the lead
        const { data: newLead, error: createError } = await supa
          .from('leads')
          .insert({
            google_place_id: googlePlaceId,
            name: leadData.name,
            address: leadData.address,
            rating: leadData.rating,
            review_count: leadData.reviewCount,
            business_type: leadData.type,
            phone: leadData.phone,
            google_maps_url: leadData.googleMapsUrl,
            website: leadData.website,
            city: leadData.address?.split(',')?.slice(-3, -2)?.[0]?.trim()?.toLowerCase() || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('[LOG CALL API] Failed to create lead:', createError);
          throw createError;
        }
        targetLeadId = newLead.id;
      }
    }

    if (!targetLeadId) {
      return NextResponse.json({ 
        error: 'Missing lead identification', 
        received: { leadId, googlePlaceId, hasLeadData: !!leadData },
      }, { status: 400 });
    }

    // 2. Create call log entry (rep_id can be null for unregistered reps)
    const { error: logError } = await supa.from('call_log').insert({
      lead_id: targetLeadId,
      rep_id: repId?.includes('-') ? repId : null,
      outcome,
      notes,
      followup_date: followupDate || null,
    });

    if (logError) {
      console.error('[LOG CALL API] Call log insertion failed:', logError);
      // Don't throw - continue to update lead
    }

    // 3. Update lead status and stats
    const { data: lead } = await supa.from('leads').select('times_called').eq('id', targetLeadId).single();
    const newTimesCalled = (lead?.times_called || 0) + 1;

    const { error: updateError } = await supa.from('leads').update({
      times_called: newTimesCalled,
      last_called_at: new Date().toISOString(),
      last_called_by: repId?.includes('-') ? repId : null,
      call_status: outcome,
      next_followup: followupDate || null,
      lead_notes: notes,
    }).eq('id', targetLeadId);

    if (updateError) {
      console.error('[LOG CALL API] Lead update failed:', updateError);
      // Don't throw - call was still logged
    }

    return NextResponse.json({ success: true, leadId: targetLeadId });
  } catch (error: any) {
    console.error('[LOG CALL API] Error:', error);
    const msg = error.message || 'Internal error';
    if (msg.includes('does not exist') || msg.includes('schema cache')) {
      return NextResponse.json({ 
        error: `Database tables not set up. Run the migration SQL in Supabase Dashboard.`,
        code: 'TABLES_MISSING'
      }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
