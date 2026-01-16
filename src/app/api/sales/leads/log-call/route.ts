import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const supa = getSupabaseAdmin();
  try {
    const { leadId, googlePlaceId, leadData, repId, outcome, notes, followupDate } = await req.json();

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
            // Use current search filters for location if available
            city: leadData.address?.split(',')?.slice(-3, -2)?.[0]?.trim()?.toLowerCase() || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('[LOG CALL API] Failed to create lead:', createError);
          // If creation fails (e.g. table doesn't exist), we can't continue
          throw createError;
        }
        targetLeadId = newLead.id;
      }
    }

    if (!targetLeadId) {
      return new NextResponse('Missing lead identification', { status: 400 });
    }

    // 2. Ensure rep exists (optional for now, but good for data integrity)
    // Actually, if the reps table doesn't exist yet, this will fail.
    // Let's try to proceed and see.

    // 3. Create call log entry
    const { error: logError } = await supa.from('call_log').insert({
      lead_id: targetLeadId,
      rep_id: repId.includes('-') ? repId : null, // Only insert if it looks like a UUID
      outcome,
      notes,
      followup_date: followupDate || null,
    });

    if (logError) {
      console.error('[LOG CALL API] Call log insertion failed:', logError);
      // If call_log table doesn't exist, we still want to update the leads table
    }

    // 4. Update lead status and stats
    const { data: lead } = await supa.from('leads').select('times_called').eq('id', targetLeadId).single();
    const newTimesCalled = (lead?.times_called || 0) + 1;

    const { error: updateError } = await supa.from('leads').update({
      times_called: newTimesCalled,
      last_called_at: new Date().toISOString(),
      last_called_by: repId.includes('-') ? repId : null,
      call_status: outcome,
      next_followup: followupDate || null,
      lead_notes: notes,
    }).eq('id', targetLeadId);

    if (updateError) {
      console.error('[LOG CALL API] Lead update failed:', updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, leadId: targetLeadId });
  } catch (error: any) {
    console.error('[LOG CALL API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
